//imports
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

//config json.response
app.use(express.json());

//Models
const User = require("./models/User");

//Open Route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem viundo a nossa API!" });
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split("")[1];
  if (!token) {
    return res.status(401).json({ msg: "Acesso negado" });
  }
  try {
    const secret = process.env.SECRET;
    jwt.verify(token, secret);

    next();
  } catch (e) {
    return res.status(400).json({ msg: "token invalido" });
  }
}

//Close Route
app.get("/users/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  //check if user exists

  const user = await User.findById(id, "-password");
  if (!user) {
    return res.status(404).json({ msg: "usuario nao encontrado" });
  }
  return res.status(200).json(user);
});

//Register User
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  //validations
  if (!name) {
    return res.status(422).json({ msg: "o nome é obrigatorio" });
  }
  if (!email) {
    return res.status(422).json({ msg: "o email é obrigatorio" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatorio" });
  }
  if (confirmpassword !== password) {
    return res.status(422).json({ msg: " senha precisa ser igual" });
  }
  if (confirmpassword == null || password == null) {
    return res.status(422).json({ msg: "A senha não pode ser nula." });
  }
  const userExist = await User.findOne({ email: email });
  if (userExist) {
    return res.status(422).json({ msg: "por favor email ja utilizado" });
  }
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    password: passwordHash,
  });
  try {
    await user.save();
    res.status(201).json({ msg: "usuario criado com sucesso" });
  } catch (error) {
    res.status(500).json({ msg: "Aconteceu um erro no servidor", error });
  }
});

app.get("/allusers", async (req, res) => {
  const users = await User.find({});
  try {
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ msg: "Error, tem algo errado", e });
  }
});

//Login User

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(422).json({ msg: "o email é obrigatorio" });
  }
  if (!password) {
    res.status(422).json({ msg: "a senha é obrigatoria" });
  }

  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(422).json({ msg: "Usuario nao encontrado" });
  }
  const checkPassoword = await bcrypt.compare(password, user.password);
  if (!checkPassoword) {
    return res.status(422).json({ msg: "senha invalida" });
  }

  try {
    const secret = process.env.SECRET;
    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({ msg: "autenticação realizada com sucesso", token });
  } catch (e) {
    res.status(500).json({ msg: "Aconteceu um erro", e });
  }
});

//Credencials
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.tt4dtzc.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000);
    console.log("Conectado ao banco com sucesso");
  })
  .catch((err) => console.log(err));
