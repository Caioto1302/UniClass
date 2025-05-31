/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search)
  const chamadoId = params.get('id')
  const token = localStorage.getItem('token')

  const detalhesLista = document.getElementById('detalhes-chamado-lista')
  const respostasLista = document.getElementById('respostas-lista')
  const formStatus = document.getElementById('form-status')
  const selectStatus = document.getElementById('status')
  const formAdicionarResposta = document.getElementById(
    'form-adicionar-resposta',
  )
  const textareaNovaResposta = document.getElementById('nova-resposta')

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

  // Carrega detalhes do chamado e respostas
  async function carregarChamado() {
    try {
      const response = await fetch(
        `http://localhost:5000/chamado/${chamadoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        },
      )
      if (!response.ok) throw new Error('Erro ao buscar chamado')
      const chamado = await response.json()

      detalhesLista.innerHTML = `
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
      `
      selectStatus.value = chamado.status

      // Respostas
      if (chamado.Respostas && chamado.Respostas.length > 0) {
        respostasLista.innerHTML = chamado.Respostas.map(
          (resposta) => `
          <li data-id="${resposta.id}">
            <div>
              <strong>Mensagem:</strong> <span class="mensagem">${resposta.mensagem}</span>
              <br>
              <strong>Data:</strong> ${new Date(
                resposta.dataEnvio,
              ).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div class="botoes">
              <button class="editar-resposta-btn">Editar</button>
              <button class="deletar-resposta-btn">Deletar</button>
            </div>
          </li>
          <br>
        `,
        ).join('')
      } else {
        respostasLista.innerHTML = '<p>Não respondido</p>'
      }
    } catch (err) {
      detalhesLista.innerHTML = '<li>Erro ao carregar chamado.</li>'
      respostasLista.innerHTML = ''
    }
  }

  await carregarChamado()

  // Alterar status do chamado
  formStatus.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
      const status = selectStatus.value
      console.log(chamadoId)
      console.log(status)
      console.log(token)
      const response = await fetch(
        `http://localhost:5000/chamados/${chamadoId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      )
      if (!response.ok) throw new Error('Erro ao atualizar status')
      alert('Status atualizado!')
      await carregarChamado()
    } catch (err) {
      alert('Erro ao atualizar status!')
    }
  })

  // Adicionar resposta
  formAdicionarResposta.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
      const mensagem = textareaNovaResposta.value
      const response = await fetch(`http://localhost:5000/respostas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chamadoId, mensagem }),
      })
      if (!response.ok) throw new Error('Erro ao adicionar resposta')
      textareaNovaResposta.value = ''
      alert('Resposta adicionada!')
      await carregarChamado()
    } catch (err) {
      alert('Erro ao adicionar resposta!')
    }
  })

  // Editar e deletar resposta (delegação de eventos)
  respostasLista.addEventListener('click', async (e) => {
    const li = e.target.closest('li[data-id]')
    if (!li) return
    const respostaId = li.getAttribute('data-id')

    // Editar resposta
    if (e.target.classList.contains('editar-resposta-btn')) {
      const novaMensagem = prompt(
        'Editar resposta:',
        li.querySelector('.mensagem').textContent,
      )
      if (novaMensagem && novaMensagem.trim() !== '') {
        try {
          const response = await fetch(
            `http://localhost:5000/respostas/${respostaId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ mensagem: novaMensagem }),
            },
          )
          if (!response.ok) throw new Error('Erro ao editar resposta')
          alert('Resposta editada!')
          await carregarChamado()
        } catch (err) {
          alert('Erro ao editar resposta!')
        }
      }
    }

    // Deletar resposta
    if (e.target.classList.contains('deletar-resposta-btn')) {
      if (confirm('Tem certeza que deseja deletar esta resposta?')) {
        try {
          const response = await fetch(
            `http://localhost:5000/respostas/${respostaId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            },
          )
          if (!response.ok) throw new Error('Erro ao deletar resposta')
          alert('Resposta deletada!')
          await carregarChamado()
        } catch (err) {
          alert('Erro ao deletar resposta!')
        }
      }
    }
  })
})
