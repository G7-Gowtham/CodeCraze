localStorage.removeItem('cp_lvls');
localStorage.removeItem('cp_users');

const adminCred = { username: 'admin', password: 'adminpass' };
let users = [
    { username: 'user1', password: 'password123' },
    { username: 'user2', password: 'pass45678' }
];
localStorage.setItem('cp_users', JSON.stringify(users));

let levels = {
    1: { topic: 'Hello World', notes: 'Print a message to the console.\n\nSyntax: console.log("message");\nExample: console.log("Hello World");', prompt: 'Write code to print "Hello World" in console.', solution: 'console.log("Hello World");' },
    2: { topic: 'Variables', notes: 'Variables store values using let, const, or var.\n\nSyntax: let x = value;\nExample: let count = 5;', prompt: 'Declare a variable "count" with value 10 and print it.', solution: 'let count = 10;\nconsole.log(count);' },
    3: { topic: 'Data Types', notes: 'Common data types: string, number, boolean, null, undefined, object.\nExample: let flag = true; let text = "hello";', prompt: 'Create a boolean variable "isActive" and print it.', solution: 'let isActive = true;\nconsole.log(isActive);' },
    4: { topic: 'Functions', notes: 'Functions allow reusable blocks of code.\n\nSyntax: function name(params){...}\nExample: function add(a,b){ return a+b; }', prompt: 'Write a function "double" that returns a number multiplied by 2 and print a sample result.', solution: 'function double(n){ return n*2; }\nconsole.log(double(5));' },
    5: { topic: 'Arrays', notes: 'Arrays store multiple values.\n\nSyntax: let arr = [val1, val2];\nExample: let nums = [1,2,3];', prompt: 'Create an array "colors" containing "red", "green", "blue" and print it.', solution: 'let colors = ["red","green","blue"];\nconsole.log(colors);' },
    6: { topic: 'Objects', notes: 'Objects store key-value pairs.\n\nSyntax: let obj = {key: value};\nExample: let point = {x:1, y:2};', prompt: 'Create an object "book" with properties title="JS Guide" and pages=100 and print it.', solution: 'let book = {title:"JS Guide", pages:100};\nconsole.log(book);' },
    7: { topic: 'Loops', notes: 'Loops repeat code blocks: for, while, do-while.\nExample: for(let i=0;i<3;i++){ console.log(i); }', prompt: 'Write a for loop to print numbers 1 through 5.', solution: 'for(let i=1;i<=5;i++){\n  console.log(i);\n}' },
    8: { topic: 'Conditionals', notes: 'Use if, else if, else to make decisions.\nExample: if(x>10){ console.log("big"); } else { console.log("small"); }', prompt: 'Write code to check if variable "num" is even or odd and print the result.', solution: 'let num = 7;\nif(num%2===0){\n  console.log("even");\n} else {\n  console.log("odd");\n}' },
    9: { topic: 'Events', notes: 'Events respond to user actions.\nSyntax: element.addEventListener("click", function(){...});\nExample: button.addEventListener("click", ()=>alert("Clicked"));', prompt: 'Simulate a button click message in console.', solution: 'function onClick(){ console.log("Button clicked!"); }\nonClick();' },
    10: { topic: 'DOM Manipulation', notes: 'DOM allows dynamic page updates.\nSyntax: document.getElementById("id").textContent = "text";\nExample: document.getElementById("demo").textContent="Hello";', prompt: 'Print "Hello World" as if it were DOM text in the console.', solution: 'let message = "Hello World";\nconsole.log(message);' }
};
localStorage.setItem('cp_lvls', JSON.stringify(levels));

// --- rest of your original script below (unchanged) ---
let currentUser = null, currentRole = null, currentLevel = 1;
const $ = id => document.getElementById(id);

$('hamburger').style.display = 'none';

window.addEventListener('load', () => {
    ['username', 'password', 'codeInput', 'newUser', 'newPass'].forEach(id => {
        if ($(id)) $(id).value = '';
    });
});

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    $(id).classList.add('active');
    if (id === 'loginPage') {
        ['username', 'password'].forEach(i => $(i).value = '');
        $('loginError').textContent = '';
        $('hamburger').style.display = 'none';
    }
    if (id === 'playPage') {
        $('codeInput').value = ''; $('output').textContent = ''; $('status').textContent = '';
        toggleHamburger();
    }
    if (id === 'usersPage') { ['newUser', 'newPass'].forEach(i => $(i).value = ''); toggleHamburger(); }
    if (id === 'levelsPage') { toggleHamburger(); }
}

function toggleHamburger() {
    if (currentRole === 'admin') {
        if (window.innerWidth <= 768) {
            $('hamburger').style.display = 'block';
            $('desktopNav').style.display = 'none';
        } else {
            $('hamburger').style.display = 'none';
            $('desktopNav').style.display = 'flex';
        }
    } else if (currentRole === 'user') {
        $('hamburger').style.display = 'none';
        $('desktopNav').style.display = 'flex';
    } else {
        $('hamburger').style.display = 'none';
        $('desktopNav').style.display = 'none';
    }
}

function buildNav() {
    const desktop = $('desktopNav');
    const side = $('sidebar');
    desktop.innerHTML = ''; side.innerHTML = '';

    function addLink(txt, route) {
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.route = route;
        a.textContent = txt;
        a.onclick = navHandler;
        const b = a.cloneNode(true);
        b.onclick = navHandler;
        desktop.appendChild(a);
        side.appendChild(b);
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
}

function navHandler(e) {
    e.preventDefault();
    $('sidebar').classList.remove('open');
    showPage(this.dataset.route);
    if (this.dataset.route === 'playPage') loadLevelList();
    if (this.dataset.route === 'levelsPage') refreshLevelAdminList();
}

$('loginForm').onsubmit = e => {
    e.preventDefault();
    const r = $('roleSelect').value, u = $('username').value.trim(), p = $('password').value.trim();
    if (r === 'admin') {
        if (u === adminCred.username && p === adminCred.password) { currentUser = u; currentRole = r; loginSuccess(); return; }
    } else {
        const match = users.find(x => x.username === u && x.password === p);
        if (match) { currentUser = u; currentRole = r; loginSuccess(); return; }
    }
    $('loginError').textContent = 'Invalid credentials';
};

function loginSuccess() {
    $('loginPage').classList.remove('active');
    $('welcome').textContent = `Welcome ${currentUser} (${currentRole})`;
    buildNav();
    showPage('playPage');
    loadLevelList();
    toggleHamburger();
}

function logout() {
    currentUser = null; currentRole = null;
    $('hamburger').classList.remove('show'); $('sidebar').classList.remove('open'); $('desktopNav').innerHTML = ''; $('welcome').textContent = '';
    showPage('loginPage');
}

$('hamburger').onclick = () => $('sidebar').classList.toggle('open');

function loadLevelList() {
    const ul = $('levelList'); ul.innerHTML = '';
    Object.keys(levels).sort((a, b) => a - b).forEach(n => {
        const li = document.createElement('li'); li.tabIndex = 0; li.textContent = `Level ${n}`;
        li.onclick = () => loadLevel(n);
        ul.appendChild(li);
    });
    loadLevel(currentLevel);
}

function loadLevel(n) {
    currentLevel = n;
    document.querySelectorAll('#levelList li').forEach(li => li.classList.remove('active'));
    const items = [...document.querySelectorAll('#levelList li')]; items[n - 1]?.classList.add('active');
    $('notes').textContent = levels[n].notes;
    $('prompt').textContent = levels[n].prompt;
    $('topicName').textContent = levels[n].topic;
    $('codeInput').value = ''; $('output').textContent = ''; $('status').textContent = '';
}

$('runBtn').onclick = () => {
    const code = $('codeInput').value; let out = '';
    try {
        const orig = console.log;
        console.log = (...a) => (out += a.join(' ') + '\n');
        new Function(code)();
        console.log = orig;
        out = out.trim();
        if (!out) { $('output').textContent = '[No output]'; $('status').textContent = '❌ Not correct'; $('status').className = 'incorrect'; }
        else { $('output').textContent = out; $('status').textContent = '✅ Correct!'; $('status').className = 'correct'; }
    } catch (e) { $('output').textContent = 'Error: ' + e.message; $('status').textContent = '❌ Not correct'; $('status').className = 'incorrect'; }
};

$('addLevelForm').onsubmit = e => {
    e.preventDefault();
    const n = $('lvlNum').value.trim(), topic = $('lvlTopic').value.trim(), notes = $('lvlNotes').value.trim(),
        pr = $('lvlPrompt').value.trim(), sol = $('lvlSolution').value.trim();
    if (!n || !topic || !notes || !pr || !sol) { alert('Fill all fields'); return; }
    levels[n] = { topic, notes, prompt: pr, solution: sol };
    localStorage.setItem('cp_lvls', JSON.stringify(levels));
    alert('Level saved'); e.target.reset(); loadLevelList(); refreshLevelAdminList();
};

function refreshLevelAdminList() {
    const container = $('levelAdminList'); if (!container) return; container.innerHTML = '';
    Object.keys(levels).sort((a, b) => a - b).forEach(n => {
        const box = document.createElement('div'); box.style.borderBottom = '1px solid #ccc'; box.style.padding = '.5rem 0';
        const info = document.createElement('div');
        info.innerHTML = `<strong style="color:#000;">Level ${n}</strong><br><b>Topic:</b> ${levels[n].topic}<br><b>Notes:</b> ${levels[n].notes}<br><b>Prompt:</b> ${levels[n].prompt}<br><b>Solution:</b> <code>${levels[n].solution}</code>`;
        const btns = document.createElement('div'); btns.style.marginTop = '.3rem';
        const editBtn = document.createElement('button'); editBtn.textContent = 'Edit'; editBtn.className = 'action'; editBtn.style.marginRight = '.5rem';
        editBtn.onclick = () => { $('lvlNum').value = n; $('lvlTopic').value = levels[n].topic; $('lvlNotes').value = levels[n].notes; $('lvlPrompt').value = levels[n].prompt; $('lvlSolution').value = levels[n].solution; window.scrollTo({ top: $('levelsPage').offsetTop, behavior: 'smooth' }); };
        const delBtn = document.createElement('button'); delBtn.textContent = 'Delete'; delBtn.className = 'action';
        delBtn.onclick = () => { if (confirm(`Delete Level ${n}?`)) { delete levels[n]; localStorage.setItem('cp_lvls', JSON.stringify(levels)); refreshLevelAdminList(); loadLevelList(); } };
        btns.append(editBtn, delBtn); box.append(info, btns); container.appendChild(box);
    });
}

$('addUserForm').onsubmit = e => {
    e.preventDefault();
    const nu = $('newUser').value.trim(), np = $('newPass').value.trim();
    if (users.some(u => u.username === nu)) { alert('Username exists'); return; }
    if (np.length < 8) { alert('Password must be at least 8 chars'); return; }
    users.push({ username: nu, password: np }); localStorage.setItem('cp_users', JSON.stringify(users)); e.target.reset(); refreshUsers();
};

function refreshUsers() {
    const div = $('userList'); div.innerHTML = '';
    users.forEach((u, i) => {
        const row = document.createElement('div');
        const name = document.createElement('span'); name.textContent = u.username;
        const pass = document.createElement('span'); pass.textContent = '********';
        const showBtn = document.createElement('button'); showBtn.textContent = 'Show';
        showBtn.onclick = () => { if (showBtn.textContent === 'Show') { pass.textContent = u.password; showBtn.textContent = 'Hide'; } else { pass.textContent = '********'; showBtn.textContent = 'Show'; } };
        const editBtn = document.createElement('button'); editBtn.textContent = 'Edit';
        editBtn.onclick = () => { const nu = prompt('New username', u.username); if (!nu) return; if (users.some((x, j) => x.username === nu && j !== i)) { alert('Username exists'); return; } const np = prompt('New password (min 8 chars)', u.password); if (!np || np.length < 8) { alert('Password ≥8 chars'); return; } users[i] = { username: nu, password: np }; localStorage.setItem('cp_users', JSON.stringify(users)); refreshUsers(); };
        const delBtn = document.createElement('button'); delBtn.textContent = 'Delete';
        delBtn.onclick = () => { if (confirm(`Delete user ${u.username}?`)) { users.splice(i, 1); localStorage.setItem('cp_users', JSON.stringify(users)); refreshUsers(); } };
        row.append(name, pass, showBtn, editBtn, delBtn); div.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    refreshUsers(); refreshLevelAdminList(); toggleHamburger();
});

window.addEventListener('resize', toggleHamburger);
