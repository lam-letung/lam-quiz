import express, { Request, Response } from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser()); // đừng quên dòng n

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // GET all
app.get("/api/flashcards", async (_req: Request, res: Response) => {
  const cards = await prisma.flashCard.findMany({ orderBy: { createdAt: "desc" } });
  res.json(cards);
});

// POST new
app.post("/api/flashcards", async (req: Request, res: Response) => {
  const { term, definition } = req.body;
  if (!term || !definition) return res.status(400).json({ error: "term + definition required" });
  const newCard = await prisma.flashCard.create({ data: { term, definition } });
  res.status(201).json(newCard);
});

// GET single
app.get("/api/flashcards/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const card = await prisma.flashCard.findUnique({ where: { id } });
  if (!card) return res.status(404).json({ error: "Not found" });
  res.json(card);
});

// PUT update
app.put("/api/flashcards/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { term, definition } = req.body;
  const updated = await prisma.flashCard.update({
    where: { id },
    data: { term, definition },
  });
  res.json(updated);
});

// DELETE
app.delete("/api/flashcards/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.flashCard.delete({ where: { id } });
  res.status(204).end();
});


// GET all flashcard sets with cards
app.post("/api/flashcard-sets", requireUser, async (req, res) => {
  const { title, description, cards, workplaceId } = req.body;
  const created = await prisma.flashCardSet.create({
    data: {
      title,
      description,
      userId: req.userId,
      workplaceId: workplaceId || null,
      cards: {
        create: (cards || []).map((c, i) => ({
          term: c.term,
          definition: c.definition,
          order: i,
        })),
      },
    },
    include: { cards: true },
  });
  res.status(201).json(created);
});



app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, password: hashed } });

  res.status(201).json({ id: user.id, username: user.username });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.cookie("remember", {userId: user.id, userName: user.username}, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ message: "Logged in", user: { userId: user.id, userName: user.username } });
});

function requireUser(req, res, next) {
  const {userId, userName} = req.cookies.remember;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

app.get("/api/me/flashcard-sets", requireUser, async (req, res) => {
  const sets = await prisma.flashCardSet.findMany({
    where: { userId: req.userId },
    include: { cards: true },
    orderBy: { createdAt: "desc" },
  });
  if(!sets){
    res.json([])
  }
  res.json(sets);
});

app.put("/api/flashcard-sets/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const { title, description, cards } = req.body;

  if (!title || !Array.isArray(cards)) return res.status(400).json({ error: "Invalid input" });

  // Delete old cards before replacing
  await prisma.flashCard.deleteMany({
    where: { setId: id },
  });

  const updated = await prisma.flashCardSet.update({
    where: {
      id,
      userId: req.userId, // Ensure ownership
    },
    data: {
      title,
      description,
      cards: {
        create: cards.map((card, index) => ({
          term: card.term,
          definition: card.definition,
          order: index,
        })),
      },
    },
    include: { cards: true },
  });

  res.json(updated);
});




app.get("/api/flashcard-sets/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const set = await prisma.flashCardSet.findUnique({
    where: {
      id,
      userId: req.userId,
    },
    include: {
      cards: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!set) return res.status(404).json({ error: "Not found" });
  res.json(set);
});


app.post("/api/flashcard-sets", requireUser, async (req, res) => {
  const { title, description, cards } = req.body;
  // …
  const created = await prisma.flashCardSet.create({
    data: {
      title,
      description,
      userId: req.userId,         // ⬅️ Bắt buộc
      cards: {
        create: cards.map((c, i) => ({
          term: c.term,
          definition: c.definition,
          order: i,
        })),
      },
    },
    include: { cards: true },
  });
  res.status(201).json(created);
});




app.get("/api/me", (req, res) => {
  const userInfo = req.cookies.remember;
  
  if (!userInfo) return res.status(401).json({ error: "Unauthorized" });
  res.json({userId:userInfo.userId , userName:userInfo.userName });
});



// /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("remember");
  res.json({ message: "Logged out" });
});

app.get("/api/me/workplaces", requireUser, async (req, res) => {
  const workplaces = await prisma.workplace.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(workplaces);
});

app.post("/api/me/workplaces", requireUser, async (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: "Tên là bắt buộc" });

  const created = await prisma.workplace.create({
    data: { name, description, color, userId: req.userId },
  });
  res.status(201).json(created);
});

app.put("/api/me/workplaces/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  const updated = await prisma.workplace.updateMany({
    where: { id, userId: req.userId },
    data: { name, description, color },
  });

  if (updated.count === 0) return res.status(404).json({ error: "Không tìm thấy workspace" });
  res.json({ message: "Đã cập nhật workspace" });
});

// DELETE /api/me/workplaces/:id
app.delete('/api/me/workplaces/:id', requireUser, async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  // Ensure ownership
  const wp = await prisma.workplace.findUnique({ where: { id } });
  if (!wp || wp.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Gỡ bỏ các study set khỏi workspace này
  await prisma.flashCardSet.updateMany({
    where: { workplaceId: id },
    data: { workplaceId: null },
  });

  // Xoá workspace
  await prisma.workplace.delete({ where: { id } });

  res.json({ success: true });
});


// PUT /api/me/flashcard-sets/:id/workplace
// body: { workplaceId: string | null }

app.put('/api/me/flashcard-sets/:id/workplace', requireUser, async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { workplaceId } = req.body;

  // Validate ownership
  const set = await prisma.flashCardSet.findUnique({ where: { id } });
  if (!set || set.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Optional: check if new workplace belongs to user
  if (workplaceId) {
    const wp = await prisma.workplace.findUnique({ where: { id: workplaceId } });
    if (!wp || wp.userId !== userId) {
      return res.status(400).json({ error: 'Invalid workspace' });
    }
  }

  const updated = await prisma.flashCardSet.update({
    where: { id },
    data: { workplaceId: workplaceId || null },
  });

  return res.json(updated);
});

app.delete('/api/me/flashcard-sets/:id', requireUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Sử dụng transaction để đảm bảo atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Kiểm tra quyền sở hữu
      const set = await tx.flashCardSet.findUnique({ 
        where: { id },
        select: { userId: true }
      });
      
      if (!set || set.userId !== req.userId) {
        throw new Error('Unauthorized');
      }
      
      // Xóa các flashcard thuộc set này
      await tx.flashCard.deleteMany({
        where: { setId: id },
      });
      
      // Xóa flashcard set
      await tx.flashCardSet.delete({
        where: { id },
      });
      
      return { success: true };
    });
    
    res.status(200).json({ message: 'Study set deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});
  
  return app;
}
