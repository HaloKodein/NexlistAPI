async function verifyInput() {
  const adminID = document.querySelector("#botid");
  const error = document.querySelector("#error");
  if (adminID.textContent.length <= 0){
    error.innerHTML = "Por favor, diga o id!"  
  }
}