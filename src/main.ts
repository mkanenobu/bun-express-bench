import express from "express";
import { PrismaClient, type Prisma } from "@prisma/client";

const app = express();
const port = 3300;

const prisma = new PrismaClient();

const dataSetup = async () => {
  const iter1000 = Array.from({ length: 1000 }).map((_, i) => i + 1);
  const iter50 = Array.from({ length: 50 }).map((_, i) => i + 1);

  const userData: Array<Prisma.UserCreateManyInput> = iter1000.map((i) => ({
    id: i,
    email: `${i}@example.com`,
    name: `user${i}`,
  }));
  const postData: Array<Prisma.PostCreateManyInput> = iter1000
    .map((i) => {
      return iter50.map((_, j) => {
        return {
          title: `title${i}-${j}`,
          content: `content${i}-${j}`,
          published: true,
          authorId: i,
        };
      });
    })
    .flat();

  return prisma.$transaction(
    async (tx) => {
      await tx.post.deleteMany();
      await tx.user.deleteMany();

      await tx.user.createMany({
        data: userData,
        skipDuplicates: true,
      });
      await tx.post.createMany({
        data: postData,
        skipDuplicates: true,
      });
    },
    { timeout: 30 * 1000, maxWait: 30 * 1000 },
  );
};

await dataSetup();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/random-user", async (req, res) => {
  const userName = `user${randomRange(1, 1000)}`;
  // console.log(userName);
  const user = await prisma.user.findFirst({
    where: {
      name: userName,
    },
    include: {
      posts: true,
    },
  });
  return res.json({ user });
});
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      posts: true,
    },
  });
  return res.json({ users });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const randomRange = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
};
