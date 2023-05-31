const form = document.getElementById("form_sentence");

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    let sentence = formData.get("sentence");
    if (sentence.length <= 1) {
      alertMessage("error", "Please Input at least 2 characters!");
      return;
    }

    const submitButton = form.querySelector('input[type="submit"]');

    submitButton.disabled = true;
    submitButton.classList.add('button-loading');

    try {
      const response = await window.axios.openAI(formData.get("sentence"));

      if (response && response.error) {
        document.querySelector("#div-result textarea").innerHTML = response.error.message;
        return;
      }

      let result = (response && response.choices && response.choices[0].text) || '';
      document.getElementById("sentence_corrected").innerHTML = JSON.stringify(result).replace(/\\n/g, '');

      const db_response = await window.axios.backend('post', {
        topic: sentence,
        story: result
      });
      console.log(db_response);
    } catch (error) {
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('button-loading');
    }
  });
}

function alertMessage(status, sentence) {
  window.Toastify.showToast({
    text: sentence,
    duration: 3000,
    stopOnFocus: true,
    style: {
      textAlign: "center",
      background: status == "error" ? "#E76161" : "#539165",
      color: "white",
      padding: "5px",
      marginTop: "2px"
    }
  });
}
