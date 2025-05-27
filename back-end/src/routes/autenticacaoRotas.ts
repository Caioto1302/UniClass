import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { validaBodyCadastro } from '../validators/validaBodyCadastro'
import { verificaEmail } from '../services/usuarios/verificaEmail'
import { criaUsuario } from '../services/usuarios/criaUsuario'
import { validaBodyLogin } from '../validators/validaBodyLogin'
import { verificaLogin } from '../services/usuarios/verificaLogin'
import { enviaEmail } from '../email_services/enviaEmail'
import { redefineSenha } from '../services/usuarios/redefineSenha'

export async function autenticacaoRotas(app: FastifyInstance) {
  // POST - Cadastra um usuário

  app.post<{
    Body: { nome: string; sobrenome: string; email: string; senha: string }
  }>('/cadastro', async (request, reply) => {
    try {
      validaBodyCadastro(request)

      const usuarioExistente = await verificaEmail(request.body.email)

      if (usuarioExistente) throw new Error('E-mail já cadastrado')

      const usuario = await criaUsuario(request)

      await enviaEmail(
        usuario.email,
        'UNICLASS - BEM VINDO A UNICLASS',
        `
        <p>Aqui você resolve todos os seus probemas!</a>
        `,
      )
      return reply.status(201).send(usuario)
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.log(err)
        return reply.status(400).send({ message: 'Dados inválidos' })
      } else if (
        err instanceof Error &&
        err.message === 'E-mail já cadastrado'
      ) {
        console.log(err)
        return reply.status(409).send({ message: err.message })
      }

      console.error(err)
      return reply.status(500).send({ message: 'Erro interno no servidor' })
    }
  })

  // POST - Loga um usuário

  app.post<{ Body: { email: string; senha: string } }>(
    '/login',
    async (request, reply) => {
      try {
        // Valida os dados do login
        validaBodyLogin(request)

        // Verifica os dados no banco
        const usuario = await verificaLogin(request)

        // Gera um token JWT
        const token = jwt.sign(
          { id: usuario.id, email: usuario.email, ehAdm: usuario.ehAdm },
          process.env.JWT_SECRET!,
          {
            expiresIn: '1h',
          },
        )

        // Retorna os dados do login
        return reply.status(201).send({
          token,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
          },
        })
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.log(err)
          return reply
            .status(400)
            .send({ message: 'Dados inválidos', errors: err.errors })
        } else if (
          err instanceof Error &&
          err.message === 'E-mail ou senha inválidos'
        ) {
          console.log(err)
          return reply.status(401).send({ message: err.message })
        }

        console.error(err)
        return reply.status(500).send({ message: 'Erro interno no servidor' })
      }
    },
  )

  // POST - Recuperação de senha

  app.post<{ Body: { email: string } }>(
    '/recuperar-senha',
    async (request, reply) => {
      try {
        const usuario = await verificaEmail(request.body.email)

        if (!usuario) throw new Error('E-mail não cadastrado')

        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET!, {
          expiresIn: '1h',
        })

        const link = `http://127.0.0.1:5501/front-End/pages/redefinir-senha.html?token=${token}`

        await enviaEmail(
          request.body.email,
          'UNICLASS - RECUPERAÇÃO DE SENHA',
          `
          <p>Clique no link abaixo para redefinir sua senha:</p>
          <a href="${link}">${link}</a>
          `,
        )

        return reply
          .status(200)
          .send({ message: 'E-mail enviado com sucesso!' })
      } catch (err) {
        if (err instanceof Error && err.message === 'E-mail não cadastrado') {
          console.log(err)
          return reply.status(400).send({ message: err.message })
        }

        console.log(err)
        return reply.status(500).send({ message: 'Erro interno no servidor' })
      }
    },
  )

  // POST - Redefinição de senha

  app.post<{ Body: { token: string; novaSenha: string } }>(
    '/redefinir-senha',
    async (request, reply) => {
      try {
        const { token, novaSenha } = request.body

        await redefineSenha(token, novaSenha)

        await enviaEmail(
          request.user.email,
          'UNICLASS - REDEFINIÇÃO DE SENHA',
          `
          <p>Sua senha foi redefinida com sucesso!</a>
          `,
        )

        return reply
          .status(200)
          .send({ message: 'Senha redefinida com sucesso' })
      } catch (err) {
        return reply.status(400).send({ message: 'Token inválido ou expirado' })
      }
    },
  )
}
