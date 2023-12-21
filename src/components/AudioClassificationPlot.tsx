import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import useSWR from 'swr';
import axios from 'axios';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ChartOptions,
    ChartTypeRegistry,
    BarControllerChartOptions,
  } from 'chart.js';
import { api } from '../api';
import { useVideoController } from '../pages/VideoPage';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,

    Title,
    Tooltip,
    Legend,
    BarElement,
    zoomPlugin,
    annotationPlugin
  );



const colors = [
    '#FF6384', // Red
    '#36A2EB', // Blue
    '#FFCE56', // Yellow
    '#4BC0C0', // Teal
    '#9966FF', // Purple
    '#FF9F40', // Orange
    '#FF6384', // Pink
    '#C9CBCF', // Grey
    '#7C4DFF', // Deep Purple
    '#00BFA5', // Greenish Teal
    '#DCE775', // Lime
    '#BA68C8', // Light Purple
    '#F06292', // Bright Pink
    '#FFD54F', // Light Yellow
    '#4DD0E1'  // Light Blue
];



export function AudioClassificationPlot() {

    const { store } = useVideoController();
    const importantClasses = store.useState(s => s.presets.default.targetClasses);
    const videoId = store.id;
    const data = store.useState(s => s.classificatorData);
    const duration = store.useState(s => s.duration);
    const auidoHighlights = store.useState(s => s.audioHighlightsTier1);
    const isLoading = !data;

    if (isLoading) return <div>Loading...</div>;


    console.log('recompute chart data');


    const ticksCnt = data.scores[0].length;
    const timeInterval = 960 + 480; //  YAMNet uses 0.96-second windows with a 0.48-second hop (stride) between them
    const labels = data ? data.scores[0].map((_, index) => formatTime(duration / ticksCnt * index)) : [];
    
   
    const datasets = data!.scores.map((scoreArray, index) => ({
        label: data!.classNames[index],
        data: scoreArray,
        backgroundColor: colors[index % colors.length],
    })).filter(dataset => importantClasses.includes(dataset.label));

    const chartData = {
        labels,
        datasets,
    };

    const annotations = {};
    auidoHighlights.forEach((segment, index) => {
        annotations[`annotation${index}`] = {
            type: 'box',
            xMin: segment.startAudioFrameInd,
            xMax: segment.startAudioFrameInd + segment.durationInAudioFrames,
            backgroundColor: 'rgba(255, 99, 132, 0.25)'
        }
    });
    


    
    const chartOptions: ChartOptions = {

        scales: {
            y: {
                beginAtZero: true,
            },
            x: {
                stacked: true,
            }
        },
        plugins: {
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true, // enable zooming using mouse wheel
                    },
                    pinch: {
                        enabled: true, // enable zooming using pinch gestures
                    },
                    mode: 'x', // enable zooming in both X and Y directions
                },
                pan: {
                    enabled: true, // enable panning
                    mode: 'x', // enable panning in both X and Y directions
                },
            },
            annotation: {
                annotations,
            }
        },
        maintainAspectRatio: false,
        normalized: true,
        animation: false,
        
        categoryPercentage: 1.0,
        barPercentage: 1.0,
        layout: {
            // padding: -20,
        }
    };

    return (
        <div>
            {data && (
                <Bar height="400px" data={chartData} options={chartOptions} />
            )}
        </div>
    );
}


// Helper function to convert milliseconds to hh:mm:ss.ms format
function formatTime(milliseconds) {
  let date = new Date(milliseconds);
  let hours = date.getUTCHours().toString().padStart(2, '0');
  let minutes = date.getUTCMinutes().toString().padStart(2, '0');
  let seconds = date.getUTCSeconds().toString().padStart(2, '0');
  let ms = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}