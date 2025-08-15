

window.onload = async function () {

  const resp1 = await fetch('/dashboard');
  const { email } = await resp1.json();

  const resp2 = await fetch('/mygroups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (resp2.redirected) {
    window.location.href = resp2.url;
    return;
  }

  const { list } = await resp2.json();

  for (const [id, name] of Object.entries(list)) {
    const parent = document.getElementById('a');
    let child = document.createElement('div');
    const row = document.createElement('div');
    const row1 = document.createElement('div');
    row.dataset.id = id;
    row.innerHTML = `<strong>${name}</strong>`;
    row1.innerHTML = `(ID: ${id})`;

    row.style.cursor = 'pointer';
    row.addEventListener('click', () => redirect1(id)); 

    child.appendChild(row);
    child.appendChild(row1)
    parent.appendChild(child);
  }

};

function addGroup() {
  const name = document.getElementById('name-el').value.trim();
  const pass = document.getElementById('pass-el').value.trim();
  const msg = document.getElementById('msg-el');
  msg.textContent = '';

  if (!name || !pass) {
    msg.textContent = 'Please enter both name and password.';
    return;
  }

  fetch('/addGroup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, key: pass })
  })
    .then(r => r.json())
    .then(data => {
      msg.textContent = data.status;

      if (data.status === 'Success') {
        document.getElementById('name-el').value = '';
        document.getElementById('pass-el').value = '';
        const parent = document.getElementById('a');
        let child = document.createElement('div');
        const row = document.createElement('div');
        const row1 = document.createElement('div');
        row.innerHTML = `<strong>${name}</strong>`;
        row.dataset.id = data.id;
        row1.innerHTML = `(ID: ${data.id})`;
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => redirect1(data.id)); 

        child.appendChild(row);
        child.appendChild(row1)
        parent.appendChild(child);
      }
    });

}

function joinGroup() {
  const id = document.getElementById('id-el').value.trim();
  const pass = document.getElementById('pass-el2').value.trim();
  const msg = document.getElementById('msg-el');
  msg.textContent = '';

  if (!id || !pass) {
    msg.textContent = 'Please enter both group ID and password.';
    return;
  }

  fetch('/joinGroup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, key: pass })
  })
    .then(r => r.json())
    .then(data => {
      msg.textContent = data.status;
      if(data.status==='Success'){
        document.getElementById('id-el').value = '';
        document.getElementById('pass-el2').value = '';
        const parent = document.getElementById('a');
        let child = document.createElement('div');
        const row = document.createElement('div');
        const row1 = document.createElement('div');
        row.innerHTML = `<strong>${data.name}</strong>`;
        row.dataset.id = data.id;
        row1.innerHTML = `(ID: ${id})`;
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => redirect1(id));

        child.appendChild(row);
        child.appendChild(row1)
        parent.appendChild(child);
      }
    });
}




async function redirect1(gid) {
  let parent = document.getElementById('b');
  console.log("clicked");
  clearDiv(parent);
  let parent1 = document.getElementById('c');
  clearDiv(parent1);

  let inp1 = document.createElement('input');
  inp1.placeholder = "from";
  inp1.className="inp-el";
  let inp2 = document.createElement('input');
  inp2.placeholder = "to";
  inp2.className="inp-el";
  let inp3 = document.createElement('input');
  inp3.placeholder = "amount";
  inp3.className="inp-el";
  let btt = document.createElement('button');
  btt.textContent = 'ADD';

  btt.addEventListener('click', async () => {
    const msg = document.getElementById('msg-el');
    let personA = inp1.value.trim();
    let personB= inp2.value.trim();
    let amount = Number(inp3.value.trim());
    inp1.value = inp2.value = inp3.value = "";
    let parent1 = document.getElementById('c');

    if (!personA || !personB || isNaN(amount)) {
      alert('Please enter valid inputs');
      return;
    }

    const res =await fetch('/addexpense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gid, personA: personA, personB: personB, amount: amount })
    });
    const data=await res.json();
    msg.textContent = data.status;

    if(data.status==='Expense added successfully')
    {
      const newdiv1 = document.createElement('div');
        newdiv1.dataset.u = personA;
        newdiv1.dataset.v = personB;
        newdiv1.dataset.x = amount;
        newdiv1.dataset.id = gid;
        newdiv1.dataset.key = (typeof data._id === 'object' && data._id.$oid) ? data._id.$oid : data._id;

        const btt1 = document.createElement('button');
        btt1.textContent = 'Remove';
        btt1.addEventListener('click', removeexpense);

        const sp = document.createElement('span');
        sp.textContent = `${personB} paid ${amount} on behalf of ${personA}`;

        newdiv1.appendChild(btt1);
        newdiv1.appendChild(sp);
        parent1.appendChild(newdiv1)
         redirect_to_group(gid); 
    }

  });

  const row0 = document.createElement('div');
  row0.appendChild(inp1);
  row0.appendChild(inp2);
  row0.appendChild(inp3);
  row0.appendChild(btt);
  parent.appendChild(row0);
  const row1 = document.createElement('div');
  row1.innerHTML = 'members: ';

  const res = await fetch('/mymembers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: gid })
  });
  const data = await res.json();

  for (const [em, id] of Object.entries(data.list)) {
    row1.innerHTML += ` ${id}`;
  }

  parent.appendChild(row1);

  for (const txn of data.list2) {
  const newdiv1 = document.createElement('div');
  newdiv1.dataset.u = txn.from;
  newdiv1.dataset.v = txn.to;
  newdiv1.dataset.x = txn.amount;
  newdiv1.dataset.id = gid;


  newdiv1.dataset.key = (typeof txn._id === 'object' && txn._id.$oid) ? txn._id.$oid : txn._id;

  const btt1 = document.createElement('button');
  btt1.textContent = 'Remove';
  btt1.addEventListener('click', removeexpense);

  const sp = document.createElement('span');
  sp.textContent = `${txn.to} paid ${txn.amount} on behalf of ${txn.from}`;

  newdiv1.appendChild(btt1);
  newdiv1.appendChild(sp);
  parent1.appendChild(newdiv1);
}

  redirect_to_group(gid);
}


async function redirect_to_group(groupId) {
  console.log('Fetching group UI for groupId:', groupId);

  if (!groupId) {
    alert('Missing group ID!');
    return;
  }

  let parent = document.getElementById('b');

  try {
    const res = await fetch('/groupui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id: groupId })
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Server error: ${res.status}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const txt = await res.text();
      throw new Error('Expected JSON, got HTML');
    }

    const data = await res.json();

    if (!data) {
      throw new Error('Group not found.');
    }

    const conc=document.getElementById('conclusion');
    const { ans} = data;
    
    conc.textContent = ans;
    
  } catch (err) {
    console.error('Error fetching group UI:', err);
    alert('Could not load group data:\n' + err.message);
  }
}


function clearDiv(div) {
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
}

async function removeexpense(e) {
  const payload = {
    id:      e.target.parentElement.dataset.id,
    personA: e.target.parentElement.dataset.u,
    personB: e.target.parentElement.dataset.v,
    amount:  e.target.parentElement.dataset.x,
    key:     e.target.parentElement.dataset.key
  };
  console.log('removeexpense payload:', payload);

  

  const response = await fetch('/removeexpense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let result;
  try {
  console.log('Calling response.json() to parse the body…');
  result = await response.json();
  console.log('Parsed JSON result:', result);
} catch (err) {
  console.error('response.json() failed, raw text follows:', await response.text());
  result = { status: 'Invalid JSON' };
}

  console.log('/removeexpense response:', result);

  if (response.ok) {
    e.target.parentElement.remove();
  } else {
    alert('Failed to remove: ' + result.status);
  }
  redirect_to_group(payload.id);
}
