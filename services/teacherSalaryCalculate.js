import prisma from "../lib/prisma.js";

export async function calculateTeacherMonthlySalary(
    workerId,
    tenant_id,
    month = new Date()
) {
    // Oyning boshlanishi
    const monthStart = new Date(
        month.getFullYear(),
        month.getMonth(),
        1
    )

    // Oyning oxiri
    const monthEnd = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0
    )

    // Worker -> Teacher -> Groups -> Enrollments
    const worker = await prisma.workers.findUnique({
        where: {
            tenant_id:tenant_id,
            id: workerId,
        },
        select: {
            id: true,
            full_name: true,
            salary: true,
            salary_type: true,

            teacher: {
                select: {
                    id: true,
                    full_name: true,

                    groups: {
                        where: {
                            status: "ACTIVE",
                        },

                        select: {
                            id: true,
                            name: true,
                            price: true,
                            lesson_days:true,
                            lesson_time:true,
                            course_type:true,

                            enrollments: {
                                where: {
                                    status: "ACTIVE",

                                    // Student shu oyda guruhda bo'lgan
                                    joined_at: {
                                        lte: monthEnd,
                                    },

                                    OR: [
                                        {
                                            end_date: null,
                                        },
                                        {
                                            end_date: {
                                                gte: monthStart,
                                            },
                                        },
                                    ],
                                },

                                select: {
                                    id: true,
                                    student_id: true,
                                    joined_at: true,
                                    end_date: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!worker) {
        throw new Error("Worker topilmadi")
    }

    // Teacher emas yoki foizli salary emas
    if (
        !worker.teacher ||
        worker.salary_type !== "PERCENTAGE"
    ) {
        return {
            is_percentage: false,
            worker_id: worker.id,
            teacher_id: worker.teacher?.id ?? null,
            percentage: Number(worker.salary ?? 0),
            groups: [],
            total_students: 0,
            total_revenue: 0,
            total_salary: 0,
        }
    }

    const percentage = Number(worker.salary ?? 0)

    let totalStudents = 0
    let totalRevenue = 0
    let totalSalary = 0

    const groups = worker.teacher.groups.map(group => {
        const studentCount = group.enrollments.length

        // Guruhning umumiy oylik tushumi
        const revenue = group.price * studentCount

        // Teacher maoshi
        const salary = revenue * (percentage / 100)

        totalStudents += studentCount
        totalRevenue += revenue
        totalSalary += salary

        return {
            group_id: group.id,
            group_name: group.name,

            price: group.price,

            student_count: studentCount,
            lesson_days:group.lesson_days,
            lesson_time:group.lesson_time,
            course_type:group.course_type
        }
    })

    return {
        is_percentage: true,

        worker_id: worker.id,
        worker_name: worker.full_name,

        teacher_id: worker.teacher.id,
        teacher_name: worker.teacher.full_name,

        month: `${month.getFullYear()}-${String(
            month.getMonth() + 1
        ).padStart(2, "0")}`,

        percentage,

        total_students: totalStudents,
        total_revenue: totalRevenue,
        total_salary: totalSalary,

        groups,
    }
}

// Natijada frontendga taxminan shunday keladi:

// json
// {
//   "id": 15,
//   "full_name": "Ali Valiyev",
//   "salary": 30,
//   "salary_type": "PERCENTAGE",

//   "teacher_salary": {
//     "is_percentage": true,
//     "percentage": 30,
//     "total_students": 18,
//     "total_revenue": 9000000,
//     "total_salary": 2700000,

//     "groups": [
//       {
//         "group_id": 1,
//         "group_name": "IELTS",
//         "price": 500000,
//         "student_count": 10,
//         "revenue": 5000000,
//         "percentage": 30,
//         "salary": 1500000
//       },
//       {
//         "group_id": 2,
//         "group_name": "General English",
//         "price": 400000,
//         "student_count": 8,
//         "revenue": 4000000,
//         "percentage": 30,
//         "salary": 1200000
//       }
//     ]
//   }
// }