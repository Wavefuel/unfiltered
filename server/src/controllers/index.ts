import { Request, Response } from "express";

export const sampleController = (req: Request, res: Response) => {
	res.json({ message: "Hello from controller!" });
};
