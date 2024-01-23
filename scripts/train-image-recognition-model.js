import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';


// Parameters
const imageHeight = 224; // Modify as needed
const imageWidth = 224; // Modify as needed
const batchSize = 32; // Modify as needed
const epochs = 10; // Modify as needed

// Helper function to load image
async function loadImage(filePath) {
    try {
        const imageBuffer = fs.readFileSync(filePath);
        const tfimage = tf.node.decodeImage(imageBuffer, 3);
        return tfimage.resizeBilinear([imageHeight, imageWidth]).toFloat().div(tf.scalar(255));
    } catch (error) {
        console.error('Error loading image:', filePath, error);
        return null;
    }
}

// Load data from CSV file
async function loadDataset(imagesFolder) {
    const csvFilePath = path.join(imagesFolder, 'labels.json');
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const records = JSON.parse(fileContent);

    const imagesPromises = [];
    const labelsSet = new Set();
    records.forEach(record => {
        const imagePath = path.join(imagesFolder, record.image);
        imagesPromises.push(loadImage(imagePath));
        record.annotations.forEach(label => labelsSet.add(label.trim()));
    });

    const images = await Promise.all(imagesPromises);
    const filteredImages = images.filter(image => image !== null);

    if (filteredImages.length === 0) {
        throw new Error('No images were loaded successfully.');
    }

    const labels = Array.from(labelsSet);
    const labelsMap = labels.reduce((acc, label, index) => {
        acc[label] = index;
        return acc;
    }, {});

    const y = records.map(record => {
        const labelVector = new Array(labels.length).fill(0);
        record.annotations.forEach(label => {
            labelVector[labelsMap[label.trim()]] = 1;
        });
        return labelVector;
    });

    return { images: filteredImages, labels, y };
}

// Create model
function createModel(numLabels) {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({ inputShape: [imageHeight, imageWidth, 3], filters: 32, kernelSize: 3, activation: 'relu' }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: numLabels, activation: 'sigmoid' }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    return model;
}

// Main function to run training
async function trainModel(imagesFolder, outputPath) {
    try {
        const dataset = await loadDataset(imagesFolder);
        const x = tf.stack(dataset.images);
        const y = tf.tensor2d(dataset.y);

        const model = createModel(dataset.labels.length);

        await model.fit(x, y, {
            epochs: epochs,
            batchSize: batchSize,
            validationSplit: 0.2
        });

        await model.save(`file://${outputPath}`);
        console.log('Training complete. Model saved to ' + outputPath);
    } catch (error) {
        console.error('Error during training:', error);
    }
}


// Process arguments and run training
const [imagesFolder, outputPath] = process.argv.slice(2);
trainModel(imagesFolder, outputPath);