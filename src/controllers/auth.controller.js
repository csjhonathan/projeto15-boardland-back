import { session, users } from '../database/collections.js';
import bcrypt from 'bcrypt';
import Jwt from 'jsonwebtoken';

export async function signUp (req, res) {
	const {name, email, address, image, password} = req.body;
	
	try {
		
		console.log(await users.find().toArray());

		const user = await users.findOne({ email });
		if (user) return res.status(409).send('E-mail já cadastrado!');
		
		const hash = bcrypt.hashSync(password, 10);
		await users.insertOne({name, email, address, image, password: hash});

		res.sendStatus(201);

	} catch (err) {
		res.status(500).send(err.message);
	}
}

export async function signIn (req, res) {
	const {email, password, check} = req.body;

	try {
		
		const user = await users.findOne({email});
		if (!user) return res.status(401).send('E-mail não cadastrado!');

		const correctPassword = bcrypt.compareSync(password, user.password);
		if (!correctPassword) return res.status(401).send('Senha incorreta!');

		const payload = { idUser: user._id };
		const token = Jwt.sign(payload, process.env.JWT_SECRET);

		if (user) {
			// apagar a linha de baixo se for fazer Logout
			await session.drop({email});

			delete user.password;
			delete user._id;
			await session.insertOne({...user, idUser: payload.idUser, check, token});

			res.status(200).send(await session.find({email}).toArray());
		}
		
	} catch (err) {
		res.status(500).send(err.message);
	}
	
}