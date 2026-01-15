import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateLeadDto {

    @IsString()
    @MinLength(3)
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

