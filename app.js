const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const jwt = require("jsonwebtoken");
const uuid = require("uuid");

const uuidv4 = uuid.v4;

const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "users.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at Port localhost:3001");
      // console.log(uuidv4());
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get ALL Users API

app.get("/users", async (req, res) => {
  // res.send("Welcome postman...!");
  const sql = `SELECT * FROM users`;
  const data = await db.all(sql);
  // const list = data.json();
  res.send(data);
});

//Login API
app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = '${email}'`;
  const dbData = await db.get(sql);
  if (dbData === undefined) {
    res.status(400);
    res.send({
      err_msg: "invalid User or Email Not Registered",
    });
  } else {
    if (dbData.password === password) {
      const load = { email: email };
      const jwtToken = jwt.sign(load, "My_Token");
      res.status(200);
      res.send({ jwt_token: jwtToken });
    } else {
      res.status(400);
      res.send({ err_msg: "invalid Password!!" });
    }
  }
});

// Post Users API
app.post("/users/register", async (request, response) => {
  const userDetails = request.body;
  const { name, email, password } = userDetails;
  const id = uuidv4();

  if (name === undefined && email === undefined && password === undefined) {
    response.status(400);
    response.send({
      err_msg: "Please enter valid details like name, email, password",
    });
  } else {
    const sql = `SELECT * FROM users WHERE email = '${email}'`;
    const dbData = await db.get(sql);

    if (dbData === undefined) {
      const postUserQuery = `
      INSERT INTO
        users (id, name, email, password)
      VALUES
        ('${id}', '${name}', '${email}', '${password}');`;
      const data = await db.run(postUserQuery);
      if (data) {
        response.status(200);
        response.send({ data });
      } else {
        response.status(404);
        response.send({
          err_msg: "Something went wrong, Please try again later",
        });
      }
    } else {
      response.status(400);
      response.send({
        err_msg: "This email already exists, please use another email",
      });
    }
  }
});

// Delete User API
app.delete("/users/delete/:id", async (request, response) => {
  const { id } = request.params;
  const deleteuserQuery = `
  DELETE FROM
    users
  WHERE
    id='${id}';`;
  await db.all(deleteuserQuery);
  response.send("User Deleted");
});
