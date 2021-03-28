document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Save new email to API
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        // Present user with error message for a specified time interval 
        const alert = document.createElement('div');
        alert.innerHTML = `${result.error}`;
        alert.setAttribute('id', 'errorAlert');
        alert.setAttribute('class', 'alert alert-danger');

        document.querySelector('#compose-view').prepend(alert);
        setTimeout(function() {
          document.querySelector('#compose-view').removeChild(alert);
        }, 3000);
      } else {
        // Load Sent mailbox after email has been added to API
        load_mailbox('sent');
      }
    });
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails form API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(element => {
      const correspondence = (mailbox === 'sent' ? element.recipients : element.sender);
      const background = (element.read === true ? 'WhiteSmoke' : 'white');

      const email = document.createElement('div');
      email.setAttribute('class', 'card');
      email.setAttribute('style', `background-color: ${background};`);

      email.innerHTML = `<div id="email-${element.id}" class="card-body">
                         <span style="font-weight: bold;">${correspondence}</span>
                         <span>${element.subject}</span>
                         <span style="float: right;">${element.timestamp}</span></div>`;

      email.addEventListener('click', () => load_mail(`${mailbox}`, `${element.id}`));

      document.querySelector('#emails-view').appendChild(email);
    });
  })
}

function load_mail(mailbox, id) {
  
  // Show the selected mail and hide the mailbox
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Fetch email from API
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#email-view').innerHTML = '';
    
    const item = document.createElement('div');
    item.setAttribute('id', `email-${email.id}`);
    const renderedBody = email.body.replaceAll('\n', '<br/>'); 
    
    item.innerHTML = `<div><span style="font-weight: bold;">From:</span> ${email.sender}</div>
                      <div><span style="font-weight: bold;">To:</span> ${email.recipients}</div>
                      <div><span style="font-weight: bold;">Subject:</span> ${email.subject}</div>
                      <div><span style="font-weight: bold;">Timestamp:</span> ${email.timestamp}</div>
                      <hr/><div>${renderedBody}</div><br/>`;

    document.querySelector('#email-view').appendChild(item);

    // Add a reply button to all emails regardless of the mailbox they are currently in
    reply(`${email.sender}`, `${email.subject}`, `${email.timestamp}`, `${email.body}`);

    // Add a button to archive/unarchive emails in the inbox/archive mailbox
    if (mailbox !== 'sent') {
      toggle_archive(`${mailbox}`, `${email.id}`);
    }
  });

  // Change read status to true
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}

function reply(sender, subject, timestamp, body) {
  
  // Create a reply button
  const replyBtn = document.createElement('button');
  replyBtn.setAttribute('id', 'reply-btn');
  replyBtn.setAttribute('class', 'btn btn-primary');
  replyBtn.setAttribute('style', 'margin-right: 5px');

  replyBtn.innerHTML = 'Reply';
  document.querySelector('#email-view').appendChild(replyBtn);

  replyBtn.addEventListener('click', () => {
    compose_email();
    const answer = subject.includes('Re') ? subject : `Re: ${subject}`;

    // Prefill composition fields
    document.querySelector('#compose-recipients').value = sender;
    document.querySelector('#compose-subject').value = answer;
    document.querySelector('#compose-body').value = `On ${timestamp} ${sender} wrote: \n${body}`;
  });
}

function toggle_archive(mailbox, id) {
  
  // Create a button to either archive or unarchive an email
  const archiveBtn = document.createElement('button');
  archiveBtn.setAttribute('id', 'archive-btn');
  archiveBtn.setAttribute('class', 'btn btn-primary');

  const btnText = (mailbox === 'inbox' ? 'Archive' : 'Unarchive');
  const archive = (mailbox === 'inbox' ? true : false);

  archiveBtn.innerHTML = btnText;
  document.querySelector('#email-view').appendChild(archiveBtn);

  // Change archived status to true or false accordingly
  archiveBtn.addEventListener('click', () => {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: archive
      })
    }).then(() => {
      load_mailbox('inbox');
    })
  });
}
