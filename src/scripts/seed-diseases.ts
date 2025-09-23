// Create: src/scripts/seed-diseases.ts
import { PrismaClient, Severity } from '../generated/prisma';

const prisma = new PrismaClient();

const diseaseData = [
  {
    name: 'Healthy Crop',
    scientificName: null,
    description: 'Plant appears healthy with no disease symptoms detected',
    symptoms: ['Green healthy leaves', 'Normal growth pattern'],
    causes: [],
    treatment: 'Continue current farming practices',
    prevention: 'Regular monitoring, proper spacing, balanced fertilization',
    severity: Severity.LOW,
    crops: ['All crops'],
    isActive: true,
  },
  {
    name: 'Leaf Spot Disease',
    scientificName: 'Cercospora spp.',
    description: 'Fungal or bacterial disease causing circular spots on leaves',
    symptoms: ['Small circular brown spots', 'Yellow halos around spots'],
    causes: ['High humidity', 'Poor air circulation', 'Overhead watering'],
    treatment: 'Remove affected leaves. Apply copper-based fungicide.',
    prevention: 'Avoid overhead watering, ensure proper plant spacing',
    severity: Severity.MEDIUM,
    crops: ['Apple', 'Corn', 'Potato', 'Tomato'],
    isActive: true,
  },
  {
    name: 'Blight Disease',
    scientificName: 'Phytophthora infestans',
    description: 'Serious fungal disease causing rapid browning of plant tissues',
    symptoms: ['Rapid browning of leaves', 'Water-soaked lesions'],
    causes: ['Cool wet weather', 'High humidity', 'Poor drainage'],
    treatment: 'Remove infected plants. Apply systemic fungicide.',
    prevention: 'Use resistant varieties, ensure good drainage',
    severity: Severity.HIGH,
    crops: ['Potato', 'Tomato'],
    isActive: true,
  },
  {
    name: 'Rust Disease',
    scientificName: 'Puccinia spp.',
    description: 'Fungal disease with orange/brown pustules on leaves',
    symptoms: ['Orange/brown pustules', 'Yellow spots that turn rusty'],
    causes: ['Moderate temperatures', 'High humidity', 'Dense canopy'],
    treatment: 'Apply systemic fungicide. Remove infected leaves.',
    prevention: 'Plant resistant varieties, proper spacing',
    severity: Severity.MEDIUM,
    crops: ['Wheat', 'Corn', 'Apple'],
    isActive: true,
  },
  {
    name: 'Bacterial Spot',
    scientificName: 'Xanthomonas campestris',
    description: 'Bacterial infection causing dark spots on leaves and fruits',
    symptoms: ['Small dark brown spots', 'Yellow halos', 'Fruit lesions'],
    causes: ['Warm humid weather', 'Water splash', 'Contaminated tools'],
    treatment: 'Apply copper-based bactericide. Improve sanitation.',
    prevention: 'Use clean tools, avoid water splash, crop rotation',
    severity: Severity.HIGH,
    crops: ['Tomato', 'Pepper', 'Peach'],
    isActive: true,
  },
  {
    name: 'Mosaic Virus',
    scientificName: 'Tobacco Mosaic Virus',
    description: 'Viral infection causing mottled yellow/green patterns',
    symptoms: ['Mottled leaf patterns', 'Stunted growth', 'Distorted leaves'],
    causes: ['Infected seeds', 'Insect vectors', 'Contaminated tools'],
    treatment: 'Remove infected plants. Control insect vectors.',
    prevention: 'Use virus-free seeds, control insects, sanitize tools',
    severity: Severity.HIGH,
    crops: ['Tomato', 'Pepper', 'Cucumber'],
    isActive: true,
  }
];

async function seedDiseases() {
  try {
    console.log('🌱 Starting disease data seeding...');

    // Clear existing predictions and diseases
    await prisma.prediction.deleteMany({});
    await prisma.disease.deleteMany({});

    // Insert diseases
    let count = 0;
    for (const data of diseaseData) {
      await prisma.disease.create({ data });
      count++;
      console.log(`✅ Created: ${data.name}`);
    }

    console.log(`🎉 Successfully seeded ${count} diseases!`);
    
    // Verify seeding
    const totalDiseases = await prisma.disease.count();
    console.log(`📊 Total diseases in database: ${totalDiseases}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDiseases();