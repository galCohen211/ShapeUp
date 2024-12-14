import request from "supertest";
import mongoose from "mongoose";
import { startServer }  from "../../server";
import User from "../../models/user-model";
import { Express } from "express";

let server: Express;

beforeAll(async () => {
    server = await startServer();
    await User.deleteMany({});

  await User.create({
    _id: "674f67127726eba2d7318eb8",
    email: "gal1@gmail.com",
    password: "123456",
    firstName: "Gal",
    lastName: "Cohen",
    address: "Tel Aviv",
    type: "user",
    favoriteGyms: [],
    avatarUrl: "img.jpg",
  });
  await User.create({
    _id: "674f67127726eba2d7318eb4",
    email: "ron1111@gmail.com",
    password: "123456",
    firstName: "ron",
    lastName: "Cohen",
    address: "Tel Aviv",
    type: "gym_owner",
    favoriteGyms: [],
    avatarUrl: "img.jpg",
    gymOwnerLicenseImage: "owner.jpg",
  });

});

afterAll(async () => {
  await mongoose.connection.close();
});

const user = {
    email: "gal1111@gmail.com",
    password: "123456",
    firstName: "Gal",
    lastName: "Cohen",
    address: "Tel Aviv",
    type: "user",
    favoriteGyms: [],
    avatarUrl: "img.jpg",
}

const gymOwner = {
    email: "ron1111@gmail.com",
    password: "123456",
    firstName: "ron",
    lastName: "Cohen",
    address: "Tel Aviv",
    type: "gym_owner",
    favoriteGyms: [],
    avatarUrl: "img.jpg",
    gymOwnerLicenseImage: "owner.jpg",
}


describe("All user test", () => {

    test("Should get user by id", async () => {
        const res = await request(server)
            .get("/users/user/674f67127726eba2d7318eb8")
            .expect(200);
        expect(res.body.type).toBe("user");
        expect(res.body.email).toBe("gal1@gmail.com");
    });

    test("Should get gym owner by id", async () => {
        const res = await request(server)
            .get("/users/gymOwner/674f67127726eba2d7318eb4")
            .expect(200);
        expect(res.body.type).toBe("gym_owner");
        expect(res.body.email).toBe("ron1111@gmail.com");
    });
   
})
 



