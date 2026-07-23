import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "src/identity/services/auth.service";

@Controller('auth')
export class AuthController{
    constructor(private readonly authService: AuthService){}

    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    async signIn(@Body() body: {identificador: string, senha: string}){
        return await this.authService.autenticar(body.identificador, body.senha)
    }
}


