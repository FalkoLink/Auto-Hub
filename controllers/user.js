const User = require('../models/user');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const nodemailer = require('nodemailer');
const createPath = (page) => path.resolve(__dirname, '..', 'views', `${page}.ejs`);
const email = config.email;
const pass = config.pass;

// Create transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: email,
    pass: pass
  }
});

function sendEmail(recipient, subject, message) {
  // Email details
  const mailOptions = {
    from: 'ainolhuawei@gmail.com',
    to: recipient,
    subject: subject,
    text: message
  };

  // Send email
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log('Error occurred:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

exports.signInUser = async (req, res) => {
  const candidate = await User.findOne({email: req.body.email});

	if(candidate){
		const passwordResult = bcrypt.compareSync(req.body.password, candidate.password);
		if(passwordResult){
			const token = jwt.sign({
				email: candidate.email,
				userId: candidate._id
			}, config.jwt, {expiresIn: '1h'});

			res.cookie('token',token);
			res.redirect('/');
		} else{
			res.status(401).render(createPath('sign_in'), {message:'email or password is incorrect'});
		}
	}else{
		res.status(401).render(createPath('sign_in'), {message:'email or password is incorrect'});
	}
};

exports.signUpUser = async (req, res) => {
  const candidate = await User.findOne({email:req.body.email});
	if(candidate){
		res.status(409).render(createPath('sign_up'), {'message':'this email already exists'})
	}else{
		// Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

		const user = new User({firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, password: hashedPassword, age : req.body.age, country : req.body.country, gender : req.body.gender});

		try {
			// Insert user into the database
			await user.save();
			const registration = "Auto-Hub";
			const message = "We thank you for registering on our Auto-Hub website"
			sendEmail(req.body.email, registration, message);
			res.redirect('/'); // Redirect to dashboard or home page after successful registration
		} catch (error) {
			console.log(error);
			res.render(createPath('sign_up'), {message:'server error'});
		}
	}
};

exports.logOutUser = async (req, res) => {
  res.clearCookie('token');
	res.redirect('/');
};