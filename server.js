const path      = require('path');
const express   = require('express');
const mongoose  = require('mongoose');
const session   = require('express-session');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 } 
}));


app.use(express.static(path.join(__dirname, 'public')));


mongoose.connect('mongodb://localhost:27017/yourdbname', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Mongo error:', err));


const User  = require('./models/user');   
const Group = require('./models/groups');


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/submitData', async function (req, res) {
    const { email, pwd } = req.body;

    const u1 = await User.findOne({ email });

    if (u1 && u1.pwd === pwd) {
        req.session.user = { email: u1.email };
        res.redirect('/dash.html');
    }
    else if (u1 && u1.pwd !== pwd) {
        res.send("Invalid email or password");
    }
    else {
        const newu = new User({ email, pwd });
        await newu.save();
        req.session.user = { email: newu.email };
        res.redirect('/dash.html');
    }
});

app.get('/dash.html', function (req, res) {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'dash.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/dashboard',function(req,res){
    if(req.session.user)
    {
        res.json({email:req.session.user.email})
    }
    else
    res.redirect('/');
});

app.post('/mygroups',async function(req,res){

    const email=req.body.email;
    const user=await User.findOne({email})
    if(user)
    {
        const grps=user.list
        res.json({list:grps})
    }

    else
    res.redirect('/')
});

app.post('/addGroup', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const { name, key } = req.body;
    if (!name || !key) return res.status(400).send('Missing name or key');

    const allGroups = await Group.find();
    for (const group of allGroups) {
      if (group.pass === key) return res.json({status:'Password already in use'});
    }

    const user = await User.findOne({ email: req.session.user.email });
    if (!user) return res.status(400).send("User not found");

    const newGroup = await Group.create({
      title: name,
      pass:  key,
      list:  { [user._id]: user.email }
    });

    user.list = user.list || {};
    user.list[newGroup._id.toString()] = name;
    user.markModified('list');  
    await user.save();


    res.json({ status: 'Success', id: newGroup._id });

  } catch (err) {
    console.error('Caught error:', err);
    res.status(500).send('Server error');
  }
});

app.post('/joinGroup',async function(req,res){
    if (!req.session.user) return res.redirect('/');
    const{id,key}=req.body;
    const g1=await Group.findOne({_id:id})
    if(g1 && g1.pass===key){
        const user = await User.findOne({ email: req.session.user.email });
        const uid  = user._id.toString();
        g1.list[uid] = req.session.user.email;
        g1.markModified('list');
        await g1.save();
        user.list = user.list || {};
        user.list[g1._id.toString()] = g1.title;
        user.markModified('list');
        await user.save();
        return res.json({ status: 'Success', name: g1.title , id:g1._id.toString()});
    }

    else
    return res.json({status:"Invalid id or pass"})
});

app.post('/groupui', async function (req, res) {
 

  try {
    const id = req.body.id;

    if (!id) {
      console.log(' Missing ID in request body.');
      return res.status(400).json({ error: 'Missing group ID' });
    }

    const grp = await Group.findById(id);

   
    if (!grp) {
      console.log(' Group not found for ID:', id);
      return res.status(404).json({ error: 'Group not found' });
    }

    console.log(' Group found. Checking expense map...');
    console.log('Is MongooseMap?', grp.expense.constructor.name);
    console.log('Iterable directly?', typeof grp.expense.entries === 'function');
    console.log('grp.expense is', grp.expense);

    
    let m = new Map();
    let u = {};

    for (let [eid1, inner] of Object.entries(grp.expense)) {
      
      for ([eid2, x] of Object.entries(inner)) {
        let u1 = await User.findOne({ email: eid1 });
        const id1 = u1._id.toString();

        u[id1] = u1;

        let u2 = await User.findOne({ email: eid2 });
        const id2 = u2._id.toString();
        u[id2] = u2;

        if (!m.has(id1)) m.set(id1, 0);
        if (!m.has(id2)) m.set(id2, 0);

        m.set(id1, m.get(id1) - x);
        m.set(id2, m.get(id2) + x);
      }
    }

    let cred = [], debt = [];

    for (let [id, amount] of m) {
      if (amount > 0) cred.push([id, amount]);
      else if (amount < 0) debt.push([id, amount]);
    }

    let transactions = new Map();
    let i = 0, j = 0;

    while (i < debt.length && j < cred.length) {
      let [di, dAmt] = debt[i];
      let [ci, cAmt] = cred[j];
      let settleAmount = Math.min(-dAmt, cAmt);
      const diStr = di.toString();
      const ciStr = ci.toString();

      if (!transactions.has(diStr)) transactions.set(diStr, []);
      transactions.get(diStr).push([ciStr, -settleAmount]);

      if (!transactions.has(ciStr)) transactions.set(ciStr, []);
      transactions.get(ciStr).push([diStr, settleAmount]);

      debt[i][1] += settleAmount;
      cred[j][1] -= settleAmount;

      if (debt[i][1] === 0) i++;
      if (cred[j][1] === 0) j++;
    }

    let ans = "";

    const sessionUser = await User.findOne({ email: req.session.user.email });
    const userIdStr = sessionUser._id.toString();

    if (transactions.has(userIdStr)) {
      for (let [ci, amount] of transactions.get(userIdStr)) {
        const sec = u[ci];
        if (amount < 0) ans += `Pay ₹${Math.abs(amount)} to ${sec.email}\n`;
        else ans += `Get ₹${amount} from ${sec.email}\n`;
      }
    } else {
      ans = "Nothing to be paid :)";
    }

    res.json({
      ans: ans,
    });

  } catch (err) {
    console.error(' /groupui error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/addexpense', async (req, res) => {
  try {
    const { id, personA, personB, amount } = req.body;

    if (!id || !personA || !personB || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const grp = await Group.findById(id);
    let f=0;
    let f1=0;
    for(const [id,email1] of Object.entries(grp.list))
    {
      if(email1.toString() === personA) f=1;
      if(email1.toString() === personB && personA!=personB) f1=1;
    }
    if(!f || !f1)
      return res.json({status: "Error(Either personA=personB or person does not exist in group)"})

    if (!grp.expense[personA]) grp.expense[personA] = {};
    if (!grp.expense[personA][personB]) grp.expense[personA][personB] = 0;

    grp.expense[personA][personB] = Number(grp.expense[personA][personB]) + Number(amount);

    grp.markModified('expense');

    const newslate={
      from:personA,
      to:personB,
      amount:amount,
      time: new Date()
    }

    grp.transactions.push(newslate);
  const insertedTxn = grp.transactions[grp.transactions.length - 1];
  await grp.save();

  return res.status(200).json({
    status: 'Expense added successfully',
    expense: grp.expense,
    id: insertedTxn._id  
  });
} 
  catch (err) {
    console.error('Error adding expense:', err);
    return res.status(500).json({ error: 'Server error while adding expense' });
  }
});

app.post('/removeexpense', async (req, res) => {
  console.log(' /removeexpense req.body:', req.body);
  try {
    console.log(' /removeexpense req.body:', req.body);
    const { id, personA, personB, amount, key } = req.body;
    const amt = Number(amount);
    if (isNaN(amt)) return res.status(400).json({ status: 'Invalid amount' });
    const id1=id.toString();
    const grp = await Group.findById(id1);
    if (!grp) return res.status(404).json({ status: 'Group not found.' });

    if (!grp.expense[personA]?.[personB]) {
      return res.status(400).json({ status: 'Expense not found.' });
    }

    const key1=key.toString();
    grp.expense[personA][personB] -= amt;
    if (grp.expense[personA][personB] <= 0) delete grp.expense[personA][personB];
    if (Object.keys(grp.expense[personA] || {}).length === 0) delete grp.expense[personA];
    grp.markModified('expense');
    grp.transactions.pull(key1);
    grp.markModified('transactions');
    
    await grp.save();
    return res.json({ status: 'Expense removed successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'Server error.' });
  }
});

app.post('/mymembers', async (req, res) => {
  try {
    const { id } = req.body; 

    if (!id) return res.json({ status: 'Error', error: 'Group ID not provided' });

    const grp = await Group.findById(id); 

    if (!grp)
      return res.json({ status: 'Error', error: 'Group not found' });

    if (!grp.list || Object.keys(grp.list).length === 0)
      return res.json({ status: 'No members' });

    return res.json({ list: grp.list, list2:grp.transactions }); 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'Server error' });
  }
});

app.listen(3000, function () {
    console.log("server is running");
});
