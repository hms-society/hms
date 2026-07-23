import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "src/identity/services/auth.service";
import { PasswordResetService } from "src/identity/services/password-reset.service";

@Controller('auth')
export class AuthController{
    constructor(
        private readonly authService: AuthService,
        private readonly passwordResetService: PasswordResetService
    ){}

    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    async signIn(@Body() body: {identificador: string, senha: string}){
        return await this.authService.autenticar(body.identificador, body.senha)
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() body: {email: string}){
        await this.passwordResetService.solicitarRedefinicaoSenha(body.email)
    }
}


