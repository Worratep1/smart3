import React from 'react'

import FormRange from 'react-bootstrap/FormRange';
interface Props {
    defaultValue?: number;
    typeClass?: 1 | 2; 
    value?: number | null; //เพิ่ม null มาใหม่
    onChange?: ((value: number) => void | undefined) | undefined;
    min?: number;
    max?: number;
    step?: number;
    
}

const RangeSlider = ({
    defaultValue = 1,
    typeClass = 1,
    value,
    onChange,
    min = 1,
    max = 20000,
    step = 1
}: Props) => {
    return (
        <FormRange
            className={typeClass === 1 ? 'range-slider-1' : 'range-slider-2'}
            value={value ?? 0}
            onChange={(e) => onChange && onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
        />
    )
}

export default RangeSlider