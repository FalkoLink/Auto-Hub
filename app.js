const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config');
const upload = require("./middleware/multer");
const verifyToken = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser")
const { indexPage, aboutPage, servicePage,  signInPage, signUpPage} = require('./controllers/page');
const { signInUser, signUpUser, logOutUser } = require('./controllers/user');
const { getAll, getOne, create, createPage, update, updatePage, deleteById, vinPage, vin } = require('./controllers/car');

const app = express();
app.set('view engine', 'ejs');
const PORT = 3000;
const db = config.mongoURL;

mongoose.connect(db).then((res) => console.log('Connected to DB')).catch((error) => console.log(error));
const createPath = (page) => path.resolve(__dirname, 'views', `${page}.ejs`)

app.listen(PORT, (error)=>{
	error ? console.log(error) : console.log(`listening port ${PORT}`);
})

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

//Pages
app.get('/', indexPage)
app.get('/about_us', aboutPage)
app.get('/service', servicePage)
app.get('/sign_in', signInPage)
app.get('/sign_up', signUpPage)

//VIN
app.get('/vin', vinPage)
app.post('/vin', vin)

//CRUD Car
app.get('/cars', getAll)
app.get('/cars/create', createPage)
app.get('/cars/:id', getOne)
app.post('/cars', create)
app.get('/cars/:id/update', updatePage)
app.post('/cars/:id', update)
app.get('/cars/:id/delete', deleteById);

//Sign in and sign up
app.post('/sign_in', signInUser)
app.post('/sign_up', signUpUser)
app.get('/log_out', logOutUser)

//Error Page
app.use((req, res) => {
	res.status(404).render(createPath('error'));
})