import React from 'react';

function getRandomNumbers(count: number) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.random());
    }
    return numbers;
}

function heatMapColorforValue(value: number){
    var h = (1.0 - value) * 240
    return "hsl(" + h + ", 100%, 50%)";
  }

const TRACK_HEIGHT = 32;
const TRACK_NAMES_WIDTH = 256;
const valuesCount = 28800;

const datasets = [
    { name: 'track1', values: getRandomNumbers(valuesCount) },
    { name: 'track2', values: getRandomNumbers(valuesCount) },
];



export default function Timeline() {
    const height = TRACK_HEIGHT * datasets.length;
    return (
        <div className='relative border' style={{height}}>
            {/* TRACK NAMES */}
            <div className='absolute' style={{width: TRACK_NAMES_WIDTH}}>
                {datasets.map((dataset, index) => <div key={index}>{dataset.name}</div>)}
            </div>

            {/* TRACK VALUES */}
            <div className='absolute  text-nowrap overflow-x-scroll' style={{ left: TRACK_NAMES_WIDTH, top: 0, right: 0}}>
                {/* <div>
                    da das asd asd asd ad aasdasdda das asd asd asd ad aasdasdda das asd asd asd ad aasdasdda das asd asd asd ad aasdasdda
                     das asd asd asd ad aasdasdda das asd asd asd ad aasdasdda das asd asd asd ad aasdasdda das asd asd asd ad aasdasdda das asd asd asd ad aasdasdda das asd asd asd ad aasdasd
                </div> */}
               
                {datasets.map((dataset, index) => <HeatMapTrack key={index} name={dataset.name} values={dataset.values} />)}
            </div>
        </div>
    );
}

export function HeatMapTrack({ name, values }: { name: string, values: number[] }) {
    
    const cellStyle: React.CSSProperties = {
        width: 32,
        height: TRACK_HEIGHT,
        
    };
    return (
        <div className='flex'>
            {values.map((value, index) => <div key={index} style={{...cellStyle, backgroundColor:  heatMapColorforValue(value)}}>{value.toFixed(2)}</div>)}
        </div>
    );
}