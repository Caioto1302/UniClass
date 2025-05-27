/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
document.querySelector('#chamado-form').addEventListener('submit', async (event) => {
  event.preventDefault()

  const titulo = document.querySelector('#titulo').value
  const descricao = document.querySelector('#descricao').value

  try {
    const token = localStorage.getItem('token')

    const response = await fetch('http://localhost:5000/chamados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ titulo, descricao }),
    })

    if (response.ok) {
      alert('Chamado aberto com sucesso!')
      window.location.href = 'acompanhar-chamados.html'
    } else {
      const error = await response.json()
      alert(`Erro: ${error.message}`)
    }
  } catch (err) {
    alert('Erro ao conectar ao servidor.')
  }
})
