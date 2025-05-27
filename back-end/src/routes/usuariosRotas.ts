import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { autenticar } from '../middleware/autenticar.js'
import { validaId } from '../validators/validaId.js'
import { buscaUsuario } from '../services/usuarios/buscaUsuario.js'
import { buscaChamados } from '../services/chamados/buscaChamados.js'
import { deletaChamado } from '../services/chamados/deletaChamado.js'
import { buscaChamado } from '../services/chamados/buscaChamado.js'
import { criaChamado } from '../services/chamados/criaChamado.js'
import { validaBodyChamados } from '../validators/validaBodyChamados.js'
import { enviaEmail } from '../email_services/enviaEmail.js'

export async function usuariosRotas(app: FastifyInstance) {
  app.register(async (rotasProtegidas) => {
    rotasProtegidas.addHook('preHandler', autenticar)

    // GET - Puxa todos os chamados do sistema ou flitra pelo id do usuario

    rotasProtegidas.get('/chamados', async (request, reply) => {
      try {
        const chamados = await buscaChamados(request)

        return reply.status(200).send(chamados)
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.log(err)
          return reply.status(400).send({ message: 'Formato de id inválido' })
        } else if (
          err instanceof Error &&
          err.message === 'Este usuário não existe'
        ) {
          console.log(err)
          return reply.status(404).send({ message: err.message })
        } else if (
          err instanceof Error &&
          err.message === 'Este usuário não possui chamados'
        ) {
          console.log(err)
          return reply.status(404).send({ message: err.message })
        } else if (
          err instanceof Error &&
          err.message === 'Não há chamados no sistema'
        ) {
          console.log(err)
          return reply.status(404).send({ message: err.message })
        }

        console.log(err)
        return reply.status(500).send({ message: 'Erro interno no servidor' })
      }
    })

    // GET - Puxa um único chamado

    rotasProtegidas.get<{ Params: { id: string } }>(
      '/chamado/:id',
      async (request, reply) => {
        try {
          const idValido = validaId(request.params.id)

          const chamado = await buscaChamado(idValido)

          return reply.status(200).send(chamado)
        } catch (err) {
          if (err instanceof z.ZodError) {
            console.log(err)
            return reply.status(400).send({ message: 'Formato de id inválido' })
          } else if (
            err instanceof Error &&
            err.message === 'Este chamado não existe'
          ) {
            console.log(err)
            return reply.status(404).send({ message: err.message })
          }

          console.log(err)
          return reply.status(500).send({ message: 'Erro interno no servidor' })
        }
      },
    )

    // POST - Cria um novo chamado

    rotasProtegidas.post<{
      Body: { titulo: string; descricao: string }
    }>('/chamados', async (request, reply) => {
      try {
        validaBodyChamados(request)

        await buscaUsuario(request.user.id)

        const chamado = await criaChamado(request)

        await enviaEmail(
          request.user.email,
          'UNICLASS - Seu chamado foi criado com sucesso!',
          `
          <p>A criação do seu chamado foi concluída e está aguardando resposta.</p>

          <p>Você será avisado quando for respondido.</p>
          `,
        )

        return reply.status(201).send(chamado)
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.log(err)
          return reply
            .status(400)
            .send({ message: 'Formato de dados inválido' })
        } else if (
          err instanceof Error &&
          err.message === 'Este usuário não existe'
        ) {
          console.log(err)
          return reply.status(400).send({ message: err.message })
        }

        console.log(err)
        return reply.status(500).send({ message: 'Erro interno no servidor' })
      }
    })

    // DELETE - Deleta um chamado

    rotasProtegidas.delete<{ Params: { id: string } }>(
      '/chamados/:id',
      async (request, reply) => {
        try {
          const idValido = validaId(request.params.id)

          await deletaChamado(idValido)

          return reply.status(200).send('Chamado excluído com sucesso!')
        } catch (err) {
          if (err instanceof z.ZodError) {
            console.log(err)
            return reply.status(400).send({ message: 'Formato de id inválido' })
          }

          console.log(err)
          return reply.status(500).send({ message: 'Erro interno no servidor' })
        }
      },
    )
  })
}
