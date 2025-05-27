/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token')
  const listaChamados = document.querySelector('#chamados')

  try {
    const response = await fetch('http://localhost:5000/chamados', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar chamados')
    }

    const chamados = await response.json()

    if (chamados.length === 0) {
      listaChamados.innerHTML =
        '<h1>Nenhum chamado encontrado.</h1>'
      return
    }

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

    listaChamados.innerHTML = chamados
      .map(
        (chamado) => `
        <div class="chamados-bloco">
          <div>
            <h1>${chamado.titulo}</h1>
            <p>${traduzirStatus(chamado.status)}</p>
            <p>${new Date(chamado.dataCriacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
          </div>

          <div class="chamados-sub-bloco-2">
            <button class="ver-detalhes-btn" data-id="${chamado.id}">Ver detalhes</button>
          </div>
        </div>
    `,
      )
      .join('')
      
      document.querySelectorAll('.ver-detalhes-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const chamadoId = this.getAttribute('data-id')
          window.location.href = `detalhes-chamado.html?id=${chamadoId}`
        })
      })
  } catch (err) {
    listaChamados.innerHTML = `<h1>Erro ao carregar chamados.</h1>`
  }
})

