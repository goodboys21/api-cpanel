export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  const { domain, ptla, username, ram, disk, cpu, eggs, loc } = req.query;

  if (!domain || !ptla || !username || !ram || !disk || !cpu || !eggs || !loc) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    const email = `${username}@buy.guz`;
    const password = `${username}2110`;

    // 1. Buat User
    const createUser = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ptla}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: 'en',
        password
      })
    });
    const user = await createUser.json();
    if (user.errors) return res.status(500).send('Gagal membuat user.');

    const userId = user.attributes.id;

    // 2. Ambil Data Egg
    const getEgg = await fetch(`${domain}/api/application/nests/5/eggs/${eggs}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${ptla}`
      }
    });
    const eggData = await getEgg.json();

    // 3. Buat Server
    const createServer = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ptla}`,
      },
      body: JSON.stringify({
        name: username,
        user: userId,
        egg: parseInt(eggs),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: eggData.attributes.startup,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: parseInt(ram),
          swap: 0,
          disk: parseInt(disk),
          io: 500,
          cpu: parseInt(cpu)
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 5
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        }
      })
    });
    const serverData = await createServer.json();
    if (serverData.errors) return res.status(500).send('Gagal membuat server.');

    // ✅ Respon minimal
    res.status(200).json({
      email,
      username,
      password
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Gagal membuat panel: ' + err.message);
  }
}
