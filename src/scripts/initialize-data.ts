import User from "../models/user-model";
import Gym from "../models/gym-model";
import Review from "../models/review-model";

async function createGymsAndUsers() {
  try {
    // Create Gym Owner (Gal Cohen)
    const gymOwner = new User({
      email: "galcohen@example.com",
      username: "galcohen",
      password: "securepassword",
      firstName: "Gal",
      lastName: "Cohen",
      address: "123 Gym Lane",
      type: "gym_owner",
      favoriteGyms: [],
    });
    await gymOwner.save();

    // Create 2 Users (Alis and Bob)
    const userAlis = new User({
      email: "alis@example.com",
      username: "alis",
      password: "securepassword",
      firstName: "Alis",
      lastName: "Smith",
      address: "456 User Street",
      type: "user",
      favoriteGyms: [],
    });

    const userBob = new User({
      email: "bob@example.com",
      username: "bob",
      password: "securepassword",
      firstName: "Bob",
      lastName: "Johnson",
      address: "789 User Avenue",
      type: "user",
      favoriteGyms: [],
    });

    await userAlis.save();
    await userBob.save();

    // Create 2 Gyms
    const gym1 = new Gym({
      name: "Elite Fitness",
      pictures: ["elite1.jpg", "elite2.jpg"],
      location: "Downtown",
      description: "High-end gym with modern equipment.",
      amountOfReviews: 0,
      owner: gymOwner._id,
    });

    const gym2 = new Gym({
      name: "Community Gym",
      pictures: ["community1.jpg", "community2.jpg"],
      location: "Suburb",
      description: "Affordable gym for all fitness levels.",
      amountOfReviews: 0,
      owner: gymOwner._id,
    });

    await gym1.save();
    await gym2.save();

    // Add both gyms to users' favorites
    userAlis.favoriteGyms.push(gym1._id, gym2._id);
    userBob.favoriteGyms.push(gym1._id, gym2._id);

    await userAlis.save();
    await userBob.save();

    // Add Reviews on each gym from both users
    const Review1 = new Review({
      rating: 5,
      content: "Amazing gym with great facilities!",
      user: userAlis._id,
      gym: gym1._id,
    });

    const Review2 = new Review({
      rating: 4,
      content: "Good value for money.",
      user: userAlis._id,
      gym: gym2._id,
    });

    const Review3 = new Review({
      rating: 5,
      content: "Loved the atmosphere here!",
      user: userBob._id,
      gym: gym1._id,
    });

    const Review4 = new Review({
      rating: 4,
      content: "Friendly staff and clean facilities.",
      user: userBob._id,
      gym: gym2._id,
    });

    await Review1.save();
    await Review2.save();
    await Review3.save();
    await Review4.save();

    // Update amountOfReviews for gyms
    gym1.amountOfReviews += 2;
    gym2.amountOfReviews += 2;

    await gym1.save();
    await gym2.save();

    console.log("Gyms, users, and Reviews created successfully!");
  } catch (error) {
    console.error("Error creating gyms and users:", error);
  }
}

export default createGymsAndUsers;
