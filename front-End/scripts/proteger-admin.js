/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token')
  if (!token) {
    window.location.href = 'login.html'
    return
  }

  const payload = JSON.parse(atob(token.split('.')[1]))

  if (!payload.ehAdm) {
    alert('Acesso restrito a administradores!')
    window.location.href = 'inicio.html'
  }
})
