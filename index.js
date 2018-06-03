function submit() {
  let ownerAddr = document.querySelector('input').value;
  let submitBtn = document.querySelector('button')
  let statusDiv = document.querySelector('.status')

  submitBtn.disabled = true;
  statusDiv.innerText = 'Generating graph. Please wait...'

  fetch(`/api/render?owner_addr=${ownerAddr}`).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    statusDiv.innerHTML = `
      <img src="/${ownerAddr}.gv.png" style="width: 100%"/>
      <a href="/${ownerAddr}.gv.pdf">Download PDF</a>
    `;
  }).catch((err) => {
    statusDiv.innerText = `Error! ${err.message}`;
  });
}
