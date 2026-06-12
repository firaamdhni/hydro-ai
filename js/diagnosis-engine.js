const EXPERT_RULES = [
  {
    id: "sehat",
    title: "Tanaman Tampak Sehat",
    status: "Kondisi baik",
    description: "Warna daun relatif hijau dan tidak ditemukan kombinasi gejala kuat yang mengarah pada gangguan tertentu.",
    causes: [
      "Kondisi nutrisi, air, dan pencahayaan kemungkinan masih memadai",
      "Belum terlihat tekanan penyakit yang dominan"
    ],
    recommendations: [
      "Lanjutkan perawatan dan pemantauan rutin",
      "Pastikan tanaman mendapatkan cahaya sesuai kebutuhannya",
      "Periksa daun bagian bawah dan akar secara berkala"
    ],
    symptoms: ["hijau"],
    baseScore: 25
  },
  {
    id: "kekurangan-nitrogen",
    title: "Kemungkinan Kekurangan Nitrogen",
    status: "Perlu perhatian",
    description: "Daun menguning atau pucat, terutama bila dimulai dari daun yang lebih tua, sering berkaitan dengan kekurangan nitrogen.",
    causes: [
      "Konsentrasi nutrisi terlalu rendah",
      "pH media membuat unsur nitrogen sulit diserap",
      "Akar kurang sehat sehingga penyerapan nutrisi terganggu"
    ],
    recommendations: [
      "Periksa dosis dan konsentrasi nutrisi",
      "Periksa pH air atau media tanam",
      "Tambahkan nutrisi secara bertahap sesuai petunjuk produk",
      "Pantau perubahan warna daun baru selama beberapa hari"
    ],
    symptoms: ["kuning", "layu"],
    baseScore: 30
  },
  {
    id: "bercak-daun",
    title: "Kemungkinan Penyakit Bercak Daun",
    status: "Waspada penyakit",
    description: "Bercak cokelat atau kehitaman dapat berkaitan dengan infeksi jamur atau bakteri, terutama pada kondisi lembap.",
    causes: [
      "Kelembapan terlalu tinggi",
      "Daun sering basah dan sirkulasi udara kurang baik",
      "Kontaminasi dari daun atau alat yang terinfeksi"
    ],
    recommendations: [
      "Pisahkan daun yang mengalami kerusakan berat",
      "Kurangi kelembapan berlebih dan tingkatkan sirkulasi udara",
      "Hindari menyiram langsung ke permukaan daun",
      "Bersihkan alat sebelum digunakan pada tanaman lain"
    ],
    symptoms: ["cokelat", "bercak", "air-keruh"],
    baseScore: 32
  },
  {
    id: "serangan-hama",
    title: "Kemungkinan Serangan Hama",
    status: "Waspada hama",
    description: "Lubang, daun menggulung, dan keberadaan serangga merupakan kombinasi gejala yang sering muncul akibat aktivitas hama.",
    causes: [
      "Serangga pemakan daun",
      "Kutu atau telur hama di bagian bawah daun",
      "Area tanaman kurang diperiksa dan dibersihkan"
    ],
    recommendations: [
      "Periksa bagian bawah daun dan batang",
      "Singkirkan hama secara manual bila jumlahnya masih sedikit",
      "Pisahkan tanaman yang terserang",
      "Gunakan pengendalian hama yang sesuai dan aman bagi tanaman"
    ],
    symptoms: ["berlubang", "menggulung", "hama"],
    baseScore: 34
  },
  {
    id: "busuk-akar",
    title: "Kemungkinan Busuk Akar",
    status: "Perlu tindakan",
    description: "Akar cokelat atau berlendir yang disertai tanaman layu sering menunjukkan gangguan akar akibat air atau media terlalu lembap.",
    causes: [
      "Oksigen di daerah akar tidak mencukupi",
      "Air terlalu lama tergenang atau terlalu keruh",
      "Patogen berkembang pada media yang terlalu basah"
    ],
    recommendations: [
      "Periksa akar dan buang bagian yang sudah membusuk",
      "Ganti atau bersihkan air serta media tanam",
      "Perbaiki aerasi dan drainase",
      "Kurangi penyiraman sampai kondisi media lebih seimbang"
    ],
    symptoms: ["akar-cokelat", "air-keruh", "layu"],
    baseScore: 38
  }
];

function analyzeWithExpertRules(selectedSymptoms, imageStats = {}) {
  const symptoms = new Set(selectedSymptoms);

  if (imageStats.greenRatio > 1.12 && !symptoms.has("kuning") && !symptoms.has("cokelat")) {
    symptoms.add("hijau");
  }

  if (imageStats.yellowSignal > 1.08) symptoms.add("kuning");
  if (imageStats.brownSignal > 1.12) symptoms.add("cokelat");

  const ranked = EXPERT_RULES.map(rule => {
    let score = rule.baseScore;
    const matched = [];

    for (const symptom of rule.symptoms) {
      if (symptoms.has(symptom)) {
        score += 20;
        matched.push(symptom);
      }
    }

    if (rule.id === "sehat" && symptoms.size > 1) score -= 25;
    if (rule.id !== "sehat" && matched.length === 0) score -= 15;

    return {
      ...rule,
      score: Math.max(10, Math.min(96, score)),
      matched
    };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  return {
    ...best,
    confidence: best.score,
    matchedSymptoms: best.matched.length
      ? best.matched.map(formatSymptom)
      : ["Tidak ada gejala kuat yang dipilih"]
  };
}

function formatSymptom(value) {
  const labels = {
    hijau: "Warna daun dominan hijau",
    kuning: "Daun menguning atau pucat",
    cokelat: "Terdapat bagian berwarna cokelat",
    bercak: "Terdapat bercak pada permukaan daun",
    berlubang: "Daun berlubang",
    layu: "Daun terlihat layu",
    menggulung: "Daun menggulung",
    "akar-cokelat": "Akar berwarna cokelat atau berlendir",
    "air-keruh": "Air atau media terlalu lembap",
    hama: "Terlihat serangga atau telur hama"
  };
  return labels[value] || value;
}
