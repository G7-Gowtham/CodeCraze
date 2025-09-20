const adminCred = { username: 'admin', password: 'adminpass', key: 'secret123' };
let users = JSON.parse(localStorage.getItem('cp_users')) || [{ username: 'user1', password: 'password1' }];
let levels = JSON.parse(localStorage.getItem('cp_lvls')) || {
    1: { notes: 'Log "Hello World"', prompt: 'Write code to log Hello World', solution: 'console.log("Hello World");' }
};
let currentUser = null, currentRole = null, currentLevel = 1;
const $ = id => document.getElementById(id);

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    $(id).classList.add('active');
}
function buildNav() {
    const desktop = $('desktopNav'); desktop.innerHTML = '';
    const side = $('sidebar'); side.innerHTML = '';
    function addLink(txt, route) {
        const a = document.createElement('a'); a.href = '#'; a.dataset.route = route; a.textContent = txt; a.onclick = navHandler;
        const b = a.cloneNode(true); b.onclick = navHandler;
        desktop.appendChild(a); side.appendChild(b);
    }
    if (currentUser) {
        addLink('Play', 'playPage');
        if (currentRole === 'admin') {
            addLink('Edit Levels', 'levelsPage');
            addLink('Manage Users', 'usersPage');
        }
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = logout;
        const logoutBtn2 = logoutBtn.cloneNode(true);
        logoutBtn2.onclick = logout;
        desktop.appendChild(logoutBtn);
        side.appendChild(logoutBtn2);
    }
    const closeBtn = document.createElement('button');
    closeBtn.className = 'closeBtn';
    closeBtn.textContent = 'Back';
    closeBtn.onclick = () => side.classList.remove('open');
    side.appendChild(closeBtn);
}
function navHandler(e) {
    e.preventDefault();
    $('sidebar').classList.remove('open');
    showPage(this.dataset.route);
    if (this.dataset.route === 'playPage') loadLevelList();
    if (this.dataset.route === 'levelsPage') refreshLevelAdminList();
}

$('roleSelect').onchange = () =>
    $('adminKeyLabel').style.display = $('roleSelect').value === 'admin' ? 'block' : 'none';

$('loginForm').onsubmit = e => {
    e.preventDefault();
    const r = $('roleSelect').value, u = $('username').value.trim(), p = $('password').value.trim();
    if (r === 'admin') {
        if (u === adminCred.username && p === adminCred.password && $('adminKey').value === adminCred.key) {
            currentUser = u; currentRole = r; loginSuccess(); return;
        }
    } else {
        const match = users.find(x => x.username === u && x.password === p);
        if (match) { currentUser = u; currentRole = r; loginSuccess(); return; }
    }
    $('loginError').textContent = 'Invalid credentials';
};

function loginSuccess() {
    $('loginPage').classList.remove('active');
    $('welcome').textContent = `Welcome ${currentUser} (${currentRole})`;
    $('hamburger').classList.add('show');
    buildNav();
    showPage('playPage');
}
function logout() {
    currentUser = null;
    currentRole = null;
    $('hamburger').classList.remove('show');
    $('sidebar').classList.remove('open');
    $('desktopNav').innerHTML = '';
    $('welcome').textContent = '';
    showPage('loginPage');
}

$('hamburger').onclick = () => $('sidebar').classList.toggle('open');

function loadLevelList() {
    const ul = $('levelList'); ul.innerHTML = '';
    Object.keys(levels).sort((a, b) => a - b).forEach(n => {
        const li = document.createElement('li');
        li.tabIndex = 0;
        li.textContent = `Level ${n}`;
        li.onclick = () => loadLevel(n);
        ul.appendChild(li);
    });
    loadLevel(currentLevel);
}
function loadLevel(n) {
    currentLevel = n;
    $('notes').textContent = levels[n].notes;
    $('prompt').textContent = levels[n].prompt;
    $('codeInput').value = localStorage.getItem(`cp_code_${currentUser}_${n}`) || '';
    $('output').textContent = '';
    $('status').textContent = '';
}
$('runBtn').onclick = () => {
    const code = $('codeInput').value;
    localStorage.setItem(`cp_code_${currentUser}_${currentLevel}`, code);
    try {
        let out = '';
        const orig = console.log;
        console.log = (...a) => out += a.join(' ') + '\n';
        new Function(code)();
        console.log = orig;
        $('output').textContent = out || '[No output]';
        $('status').textContent =
            code.trim() === levels[currentLevel].solution.trim() ? '✅ Correct!' : '❌ Not correct yet.';
    } catch (e) { $('output').textContent = 'Error: ' + e.message; }
};

$('addLevelForm').onsubmit = e => {
    e.preventDefault();
    const n = $('lvlNum').value.trim(),
        notes = $('lvlNotes').value.trim(),
        pr = $('lvlPrompt').value.trim(),
        sol = $('lvlSolution').value.trim();
    if (!n || !notes || !pr || !sol) { alert('Fill all fields'); return; }
    levels[n] = { notes, prompt: pr, solution: sol };
    localStorage.setItem('cp_lvls', JSON.stringify(levels));
    alert('Level saved');
    e.target.reset();
    loadLevelList();
    refreshLevelAdminList();
};

// show/edit/delete list
function refreshLevelAdminList() {
    const container = $('levelAdminList');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(levels).sort((a, b) => a - b).forEach(n => {
        const box = document.createElement('div');
        box.style.borderBottom = '1px solid #ccc';
        box.style.padding = '0.5rem 0';
        const info = document.createElement('div');
        info.innerHTML = `
      <strong style="color:#000;">Level ${n}</strong><br>
      <b>Notes:</b> ${levels[n].notes}<br>
      <b>Prompt:</b> ${levels[n].prompt}<br>
      <b>Solution:</b> <code>${levels[n].solution}</code>
    `;
        const btns = document.createElement('div');
        btns.style.marginTop = '.3rem';
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'action';
        editBtn.style.marginRight = '.5rem';
        editBtn.onclick = () => {
            $('lvlNum').value = n;
            $('lvlNotes').value = levels[n].notes;
            $('lvlPrompt').value = levels[n].prompt;
            $('lvlSolution').value = levels[n].solution;
            window.scrollTo({ top: $('levelsPage').offsetTop, behavior: 'smooth' });
        };
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'action';
        delBtn.onclick = () => {
            if (confirm(`Delete Level ${n}?`)) {
                delete levels[n];
                localStorage.setItem('cp_lvls', JSON.stringify(levels));
                refreshLevelAdminList();
                loadLevelList();
            }
        };
        btns.append(editBtn, delBtn);
        box.append(info, btns);
        container.appendChild(box);
    });
}

$('addUserForm').onsubmit = e => {
    e.preventDefault();
    const nu = $('newUser').value.trim();
    const np = $('newPass').value.trim();
    if (users.some(u => u.username === nu)) { alert('Username exists'); return; }
    if (np.length < 8) { alert('Password must be at least 8 chars'); return; }
    users.push({ username: nu, password: np });
    localStorage.setItem('cp_users', JSON.stringify(users));
    e.target.reset();
    refreshUsers();
};
function refreshUsers() {
    const div = $('userList'); div.innerHTML = '';
    users.forEach((u, i) => {
        const row = document.createElement('div');
        const name = document.createElement('span'); name.textContent = u.username;
        const pass = document.createElement('span'); pass.textContent = '********';
        const showBtn = document.createElement('button');
        showBtn.textContent = 'Show';
        showBtn.onclick = () => {
            if (showBtn.textContent === 'Show') { pass.textContent = u.password; showBtn.textContent = 'Hide'; }
            else { pass.textContent = '********'; showBtn.textContent = 'Show'; }
        };
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => {
            const nu = prompt('New username', u.username);
            if (!nu) return;
            if (users.some((x, j) => x.username === nu && j !== i)) { alert('Username exists'); return; }
            const np = prompt('New password (min 8 chars)', u.password);
            if (!np || np.length < 8) { alert('Password ≥8 chars'); return; }
            users[i] = { username: nu, password: np };
            localStorage.setItem('cp_users', JSON.stringify(users));
            refreshUsers();
        };
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => {
            if (confirm(`Delete user ${u.username}?`)) {
                users.splice(i, 1);
                localStorage.setItem('cp_users', JSON.stringify(users));
                refreshUsers();
            }
        };
        row.append(name, pass, showBtn, editBtn, delBtn);
        div.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    refreshUsers();
    refreshLevelAdminList();
});