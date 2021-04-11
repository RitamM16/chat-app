import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const prisma = new PrismaClient();

/**
 * An response template for uniform response structure
 * @returns Response object
 */
export function createResponseObject() : {data: null | any, error: boolean, message: string} {
    return {
        data: null, error: false, message: ''
    }
}

/**
 * Function for handling signup request
 */
export async function signup(req: express.Request, res: express.Response) {
    const {email, name, password} = req.body;

    const responseObject = createResponseObject();

    res.status(200)

    try {
        //Check if user is already registered 
        let user = await prisma.user.findFirst({where: {
            email: email
        }})

        //If already registered, throw error
        if(user) throw Error("Account with email already exists")

        const hashedPassword = await bcrypt.hash(password, 8);
 
        //Creat new user
        user = await prisma.user.create({
            data: {email, name, password: hashedPassword}
        })

        responseObject.data = {auth: {email: user.email, name: user.name, id: user.id}}

    } catch(err) {
        console.log("error:", err);
        responseObject.error = true;
        responseObject.message = err.message
    }

    res.json(responseObject);
}

/**
 * Function to handle login request
 */
export async function login(req: express.Request, res: express.Response) {
    const { email, password } = req.body;

    res.status(200);

    const responseObject = createResponseObject();

    try {
        
        //Get the user
        let user = await prisma.user.findFirst({where: {email}})

        //If user not found
        if(!user) throw Error("Account does not exist with given email");

        const isPasswordCorrect = bcrypt.compare(password,user.password);

        //Check password
        if(!isPasswordCorrect) throw new Error("Wrong Password");

        responseObject.data = {auth: {email: user.email, name: user.name, id: user.id}}

    } catch (error) {
        console.log("error", error);
        responseObject.error = true;
        responseObject.message = error.message;
    }

    res.json(responseObject);
}