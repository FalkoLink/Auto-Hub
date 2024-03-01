const Car = require('../models/car');
const User = require('../models/user');
const config = require('../config');
const upload = require("../middleware/multer");
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');
const axios = require('axios');
const createPath = (page) => path.resolve(__dirname, '..', 'views', `${page}.ejs`);

function brandCountry(brand){
	let country;
	switch(brand){
		case 'BMW':
			country = 'DE';
			break;
		case 'Toyota':
			country = 'JP';
			break;
		case 'Mercedes':
			country = 'DE';
			break;
		case 'Audi':
			country = 'DE';
			break;
		case 'Porsche':
			country = 'DE';
			break;
		case 'Lexus':
			country = 'JP';
			break;
		case 'Ferrari':
			country = 'IT';
			break;
		case 'Tesla':
			country = 'US';
			break;
		default:
			country = null;
	}

	return country;
}

// var storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 			// Uploads is the Upload_folder_name
// 			cb(null, "uploads");
// 	},
// 	filename: function (req, file, cb) {
// 			cb(null, file.fieldname + "-" + Date.now() + ".jpg");
// 	},
// });

// // Define the maximum size for uploading
// // picture i.e. 1 MB. it is optional
// const maxSize = 1 * 1000 * 1000;

// var upload = multer({
// 	storage: storage,
// 	limits: { fileSize: maxSize },
// 	fileFilter: function (req, file, cb) {
// 			// Set the filetypes, it is optional
// 			var filetypes = /jpeg|jpg|png/;
// 			var mimetype = filetypes.test(file.mimetype);

// 			var extname = filetypes.test(
// 					path.extname(file.originalname).toLowerCase()
// 			);

// 			if (mimetype && extname) {
// 					return cb(null, true);
// 			}

// 			cb(
// 					"Error: File upload only supports the " +
// 							"following filetypes - " +
// 							filetypes
// 			);
// 	},

// 	// mypic is the name of file attribute
// }).array("img1","img2","img3");


exports.getAll = async (req, res) => {
  verifyToken(req, res);
	if(!res.auth) res.render(createPath('error'));
	const user = await User.findById(req.userId);
	const cars = await Car.find();
	res.render(createPath('cars'), {'auth': res.auth, 'admin': res.admin, 'cars': cars, 'user': user});
};

exports.getOne = async (req, res) => {
  verifyToken(req, res);
	if(!res.auth) res.render(createPath('error'));
	try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
		const user = await User.findById(req.userId);
		const country = brandCountry(car.brand);
		let flag = null;
		let logo = null;

		if(car.brand){
			flag = `https://flagsapi.com/${country}/flat/64.png`;
			const resp = await axios.get('https://api.api-ninjas.com/v1/logo', {
				params: {
					name: car.brand
				},
				headers: {
					'X-Api-Key': config.api_ninja
				}
			});
			logo = resp.data;
		}
		res.render(createPath('car'), {'auth': res.auth, 'admin': res.admin, 'car': car, 'user': user, 'flag': flag || false, 'logo': logo || false});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
	verifyToken(req, res);
	if(!res.auth || !res.admin ) res.render(createPath('error'));
	
	const { name, description, brand, price, type, img1, img2, img3 } = req.body;
	
	try {
		const newCar = new Car({ name, description, brand, price, type, img1, img2, img3});
		await newCar.save();

		res.redirect("/cars/"+newCar._id);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

exports.createPage = async (req, res) => {
	verifyToken(req, res);
	if(!res.auth || !res.admin) res.render(createPath('error'));
	const user = await User.findById(req.userId);
	res.render(createPath('create'), {'auth': res.auth, 'admin': res.admin, 'user': user});
};

exports.updatePage = async (req, res) => {
	verifyToken(req, res);
	if(!res.auth || !res.admin) res.render(createPath('error'));
	const car = await Car.findById(req.params.id);
	if(car!=null){
		const user = await User.findById(req.userId);
		res.render(createPath('update'), {'auth': res.auth, 'admin': res.admin, 'user': user, 'car': car});
	}else{
		res.status(404).json("car is not found!");
	}
};

exports.update = async (req, res) => {
	verifyToken(req, res);
	if(!res.auth || !res.admin ) res.render(createPath('error'));
	
	const { name, description, brand, price, type, img1, img2, img3} = req.body;
	try {
		const updatedCar = await Car.findByIdAndUpdate(req.params.id, { name, description, brand, price, type, img1, img2, img3 });
		if (!updatedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }
		res.redirect("/cars/"+updatedCar._id);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

exports.deleteById = async (req, res) => {
	verifyToken(req, res);
	if(!res.auth || !res.admin ) res.render(createPath('error'));
	
	try {
    const deletedCar = await Car.findByIdAndDelete(req.params.id);
    if (!deletedCar) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.redirect('/cars');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.vin = async (req, res) => {
	verifyToken(req, res);
	if(!res.auth || !res.admin ) res.render(createPath('error'));
	let vin;
	if(!req.body.vin) {
		vin=null;
	} else {
		const respV = await axios.get('https://api.api-ninjas.com/v1/vinlookup', {
			params: {
				vin: req.body.vin
			},
			headers: {
				'X-Api-Key': config.api_ninja
			}
		});
		vin = respV.data;
	}
	const user = await User.findById(req.userId);
	res.render(createPath('vin'), {'auth': res.auth, 'admin': res.admin, 'user': user, 'vin': vin});
};

exports.vinPage = async (req, res) => {
	verifyToken(req, res);
	if(!res.auth || !res.admin ) res.render(createPath('error'));
	const user = await User.findById(req.userId);
	res.render(createPath('vin'), {'auth': res.auth, 'admin': res.admin, 'user': user, 'vin': null});
};