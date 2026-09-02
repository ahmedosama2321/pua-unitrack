import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prisma } from "./db.js";
import {
  requireAuth,
  requireRole,
  requireApprovedDoctor
} from "./middleware/auth.js";

import { answerWithAI } from "./ai.js";


// ======================================================
// PATHS
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, "../../frontend");


// ======================================================
// APP
// ======================================================

const app = express();

const PORT = Number(process.env.PORT || 4000);


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || true
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

// Serve frontend files
app.use(express.static(publicDir));


// ======================================================
// HELPERS
// ======================================================

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  approval: user.approval
});


const signToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "PUA UniTrack API"
  });
});


// ======================================================
// AUTH - REGISTER DOCTOR
// ======================================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      title,
      phone,
      office,
      building
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (exists) {
      return res.status(409).json({
        message: "Email already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "DOCTOR",
        approval: "PENDING",

        doctor: {
          create: {
            title,
            phone,
            office,
            building
          }
        }
      }
    });

    return res.status(201).json({
      message:
        "Account created. An admin must approve it before you can update your live status.",

      user: safeUser(user)
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Registration failed."
    });
  }
});


// ======================================================
// AUTH - LOGIN
// ======================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: safeUser(user)
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed."
    });
  }
});


// ======================================================
// CURRENT USER
// ======================================================

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.id
      },

      include: {
        subjects: true,

        schedules: {
          orderBy: [
            {
              dayOfWeek: "asc"
            },
            {
              startTime: "asc"
            }
          ]
        }
      }
    });

    return res.json({
      user: safeUser(req.user),
      doctor
    });

  } catch (error) {
    console.error("ME ERROR:", error);

    return res.status(500).json({
      message: "Could not load user data."
    });
  }
});


// ======================================================
// GET DOCTORS
// STUDENT SEARCH
// ======================================================

app.get("/api/doctors", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const doctors = await prisma.doctor.findMany({
      where: {
        user: {
          approval: "APPROVED"
        },

        ...(q
          ? {
              OR: [
                {
                  user: {
                    name: {
                      contains: q,
                      mode: "insensitive"
                    }
                  }
                },

                {
                  subjects: {
                    some: {
                      name: {
                        contains: q,
                        mode: "insensitive"
                      }
                    }
                  }
                },

                {
                  subjects: {
                    some: {
                      code: {
                        contains: q,
                        mode: "insensitive"
                      }
                    }
                  }
                },

                {
                  building: {
                    contains: q,
                    mode: "insensitive"
                  }
                },

                {
                  office: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              ]
            }
          : {})
      },

      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },

        subjects: true
      },

      orderBy: {
        user: {
          name: "asc"
        }
      }
    });

    return res.json(doctors);

  } catch (error) {
    console.error("GET DOCTORS ERROR:", error);

    return res.status(500).json({
      message: "Could not load doctors."
    });
  }
});


// ======================================================
// GET SINGLE DOCTOR
// ======================================================

app.get("/api/doctors/:id", async (req, res) => {
  try {
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: req.params.id,

        user: {
          approval: "APPROVED"
        }
      },

      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },

        subjects: true,

        schedules: {
          orderBy: [
            {
              dayOfWeek: "asc"
            },
            {
              startTime: "asc"
            }
          ]
        },

        locations: {
          take: 20,

          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    return res.json(doctor);

  } catch (error) {
    console.error("GET DOCTOR ERROR:", error);

    return res.status(500).json({
      message: "Could not load doctor."
    });
  }
});


// ======================================================
// DOCTOR - UPDATE LOCATION
// ======================================================

app.patch(
  "/api/doctors/me/location",
  requireAuth,
  requireRole("DOCTOR"),
  requireApprovedDoctor,

  async (req, res) => {
    try {
      const {
        building,
        room,
        status
      } = req.body;

      const allowedStatuses = [
        "AVAILABLE",
        "IN_LECTURE",
        "UNAVAILABLE"
      ];

      if (
        !building ||
        !room ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          message:
            "Building, room and valid status are required."
        });
      }

      const cleanBuilding = building.trim();
      const cleanRoom = room.trim();

      const doctor = await prisma.doctor.update({
        where: {
          userId: req.user.id
        },

        data: {
          building: cleanBuilding,
          office: cleanRoom,
          status,
          lastUpdated: new Date(),

          locations: {
            create: {
              building: cleanBuilding,
              room: cleanRoom,
              status
            }
          }
        }
      });

      return res.json(doctor);

    } catch (error) {
      console.error("LOCATION ERROR:", error);

      return res.status(500).json({
        message: "Could not update location."
      });
    }
  }
);


// ======================================================
// DOCTOR - UPDATE PROFILE
// ======================================================

app.patch(
  "/api/doctors/me/profile",
  requireAuth,
  requireRole("DOCTOR"),
  requireApprovedDoctor,

  async (req, res) => {
    try {
      const {
        title,
        phone,
        office,
        building,
        subjects = []
      } = req.body;

      const doctor = await prisma.doctor.findUnique({
        where: {
          userId: req.user.id
        }
      });

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor profile not found."
        });
      }

      await prisma.subject.deleteMany({
        where: {
          doctorId: doctor.id
        }
      });

      const cleanSubjects = subjects
        .filter(Boolean)
        .map((subject) => ({
          name: String(subject).trim()
        }));

      const updated = await prisma.doctor.update({
        where: {
          id: doctor.id
        },

        data: {
          title,
          phone,
          office,
          building,

          subjects: {
            create: cleanSubjects
          }
        },

        include: {
          subjects: true
        }
      });

      return res.json(updated);

    } catch (error) {
      console.error("PROFILE ERROR:", error);

      return res.status(500).json({
        message: "Could not update profile."
      });
    }
  }
);


// ======================================================
// DOCTOR - UPDATE SCHEDULE
// ======================================================

app.put(
  "/api/doctors/me/schedule",
  requireAuth,
  requireRole("DOCTOR"),
  requireApprovedDoctor,

  async (req, res) => {
    try {
      const {
        schedules = []
      } = req.body;

      const doctor = await prisma.doctor.findUnique({
        where: {
          userId: req.user.id
        }
      });

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor profile not found."
        });
      }

      await prisma.schedule.deleteMany({
        where: {
          doctorId: doctor.id
        }
      });

      const cleanSchedules = schedules
        .map((schedule) => ({
          doctorId: doctor.id,

          dayOfWeek: Number(schedule.dayOfWeek),

          startTime: String(
            schedule.startTime || ""
          ),

          endTime: String(
            schedule.endTime || ""
          ),

          building:
            schedule.building || null,

          room:
            schedule.room || null,

          subject:
            schedule.subject || null
        }))

        .filter(
          (schedule) =>
            Number.isInteger(schedule.dayOfWeek) &&
            schedule.dayOfWeek >= 0 &&
            schedule.dayOfWeek <= 6 &&
            schedule.startTime &&
            schedule.endTime
        );

      await prisma.schedule.createMany({
        data: cleanSchedules
      });

      const result =
        await prisma.schedule.findMany({
          where: {
            doctorId: doctor.id
          },

          orderBy: [
            {
              dayOfWeek: "asc"
            },

            {
              startTime: "asc"
            }
          ]
        });

      return res.json(result);

    } catch (error) {
      console.error("SCHEDULE ERROR:", error);

      return res.status(500).json({
        message: "Could not update schedule."
      });
    }
  }
);


// ======================================================
// ADMIN - PENDING DOCTORS
// ======================================================

app.get(
  "/api/admin/pending-doctors",

  requireAuth,
  requireRole("ADMIN"),

  async (_req, res) => {
    try {
      const doctors =
        await prisma.user.findMany({
          where: {
            role: "DOCTOR",
            approval: "PENDING"
          },

          include: {
            doctor: {
              include: {
                subjects: true
              }
            }
          },

          orderBy: {
            createdAt: "desc"
          }
        });

      return res.json(doctors);

    } catch (error) {
      console.error("PENDING DOCTORS ERROR:", error);

      return res.status(500).json({
        message: "Could not load pending doctors."
      });
    }
  }
);




// ======================================================
// ADMIN - APPROVE / REJECT DOCTOR
// ======================================================

app.patch(
  "/api/admin/doctors/:id/approval",

  requireAuth,
  requireRole("ADMIN"),

  async (req, res) => {
    try {
      const {
        approval
      } = req.body;

      if (
        !["APPROVED", "REJECTED"].includes(
          approval
        )
      ) {
        return res.status(400).json({
          message:
            "Approval must be APPROVED or REJECTED."
        });
      }

      const user =
        await prisma.user.update({
          where: {
            id: req.params.id
          },

          data: {
            approval
          }
        });

      return res.json({
        user: safeUser(user)
      });

    } catch (error) {
      console.error("APPROVAL ERROR:", error);

      return res.status(500).json({
        message: "Could not update approval."
      });
    }
  }
);


// ======================================================
// ADMIN - ALL DOCTORS
// ======================================================

app.get(
  "/api/admin/doctors",

  requireAuth,
  requireRole("ADMIN"),

  async (_req, res) => {
    try {
      const doctors =
        await prisma.user.findMany({
          where: {
            role: "DOCTOR"
          },

          include: {
            doctor: {
              include: {
                subjects: true
              }
            }
          },

          orderBy: {
            name: "asc"
          }
        });

      return res.json(doctors);

    } catch (error) {
      console.error("ADMIN DOCTORS ERROR:", error);

      return res.status(500).json({
        message: "Could not load doctors."
      });
    }
  }
);

// ======================================================
// ADMIN - DELETE DOCTOR
// ======================================================

app.delete(
  "/api/admin/doctors/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const userId = req.params.id;

      const doctor = await prisma.user.findFirst({
        where: {
          id: userId,
          role: "DOCTOR"
        },
        select: {
          id: true,
          doctor: {
            select: {
              id: true
            }
          }
        }
      });

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found."
        });
      }

      await prisma.user.delete({
        where: {
          id: userId
        }
      });

      return res.json({
        success: true,
        message: "Doctor deleted successfully."
      });

    } catch (error) {
      console.error("DELETE DOCTOR ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Could not delete doctor."
      });
    }
  }
);


// ======================================================
// AI ASSISTANT
// ======================================================

app.post(
  "/api/ai/ask",

  async (req, res) => {
    try {
      const question =
        String(
          req.body.message || ""
        ).trim();

      if (!question) {
        return res.status(400).json({
          message: "Message is required."
        });
      }

      const doctors =
        await prisma.doctor.findMany({
          where: {
            user: {
              approval: "APPROVED"
            }
          },

          include: {
            user: {
              select: {
                name: true
              }
            },

            subjects: true,

            schedules: true
          }
        });

      const context =
        doctors.map((doctor) => ({
          id: doctor.id,

          name: doctor.user.name,

          title: doctor.title,

          status: doctor.status,

          building: doctor.building,

          office: doctor.office,

          lastUpdated:
            doctor.lastUpdated,

          subjects:
            doctor.subjects.map(
              (subject) => ({
                name: subject.name,
                code: subject.code,
                level: subject.level
              })
            ),

          schedules:
            doctor.schedules
        }));

      const answer =
        await answerWithAI(
          question,
          context
        );

      return res.json({
        answer
      });

    } catch (error) {
      console.error("AI ERROR:", error);

      return res.status(500).json({
        message:
          "AI service is unavailable."
      });
    }
  }
);


// ======================================================
// FRONTEND FALLBACK
// IMPORTANT:
// Don't use app.get("*") with modern Express.
// ======================================================

app.use(
  (_req, res) => {
    res.sendFile(
      path.join(
        publicDir,
        "index.html"
      )
    );
  }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  () => {
    console.log(
      `PUA UniTrack running on http://localhost:${PORT}`
    );
  }
);