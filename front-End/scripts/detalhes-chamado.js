/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search)
  const chamadoId = params.get('id')
  const token = localStorage.getItem('token')

  const detalhesLista = document.getElementById('detalhes-chamado-lista')
  const respostasLista = document.getElementById('respostas-lista')

  try {
    const response = await fetch(`http://localhost:5000/chamado/${chamadoId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error('Erro ao buscar chamado')

    const chamado = await response.json()

    detalhesLista.innerHTML = `
      <div class="chamado">
        <li><strong>Título:</strong> ${chamado.titulo}</li>
        <li><strong>Descrição:</strong> ${chamado.descricao}</li>
        <li><strong>Status:</strong> ${traduzirStatus(chamado.status)}</li>
        <li><strong>Data de criação:</strong> ${new Date(
          chamado.dataCriacao,
        ).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</li>
      </div>
    `

    if (chamado.Respostas && chamado.Respostas.length > 0) {
      respostasLista.innerHTML = chamado.Respostas.map(
        (resposta) => `
          <ul class="resposta">
            <li><strong>Mensagem:</strong> ${resposta.mensagem}</li>
            <li><strong>Data da resposta</strong>
              ${new Date(resposta.dataEnvio).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </li>
          </ul>
          <br>
          `,
      ).join('')
    } else {
      respostasLista.innerHTML = '<p>Não respondido</p>'
    }
  } catch (err) {
    detalhesLista.innerHTML = '<li>Erro ao carregar detalhes do chamado.</li>'
    respostasLista.innerHTML = ''
  }

  // Função para traduzir status
  function traduzirStatus(status) {
    switch (status) {
      case 'EmAndamento':
        return 'Em andamento'
      case 'Aberto':
        return 'Aberto'
      case 'Concluido':
        return 'Concluído'
      default:
        return status
    }
  }

  const btnDeletar = document.getElementById('deletar-chamado-btn')
  if (btnDeletar) {
    btnDeletar.addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja deletar este chamado?')) {
        try {
          const response = await fetch(
            `http://localhost:5000/chamados/${chamadoId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
          if (!response.ok) {
            const erro = await response.json()
            alert('Erro ao deletar chamado: ' + (erro.message || ''))
            return
          }
          alert('Chamado deletado com sucesso!')
          window.location.href = 'acompanhar-chamados.html'
        } catch (err) {
          alert('Erro ao deletar chamado!')
        }
      }
    })
  }
})
