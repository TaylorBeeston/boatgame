import React, { useRef, useState } from "react";
import { Container, Graphics, Text, useTick } from "@pixi/react";
import "@pixi/events";
import * as PIXI from "pixi.js";

// Custom color interpolation function
const interpolateColor = (
    color1: number,
    color2: number,
    factor: number,
): number => {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return (r << 16) | (g << 8) | b;
};

interface WakeProps {
    x: number;
    y: number;
    speed: number;
}

export const Wake: React.FC<WakeProps> = ({ x, y, speed }) => {
    return (
        <Graphics
            draw={(g) => {
                g.clear();
                const wakeWidth = Math.min(speed * 2, 100);
                const wakeHeight = Math.min(speed, 50);
                g.beginFill(0xffffff, 0.5);
                g.moveTo(x, y);
                g.lineTo(x - wakeWidth, y - wakeHeight / 2);
                g.lineTo(x - wakeWidth, y + wakeHeight / 2);
                g.lineTo(x, y);
                g.endFill();
            }}
        />
    );
};

interface CircleButtonProps {
    x: number;
    y: number;
    radius: number;
    color: number;
    alpha: number;
    text: string;
    onPress: () => void;
    onRelease?: () => void;
}

export const CircleButton: React.FC<CircleButtonProps> = ({
    x,
    y,
    radius,
    color,
    alpha,
    text,
    onPress,
    onRelease,
}) => {
    const [isPressed, setIsPressed] = useState(false);

    const handlePointerDown = () => {
        setIsPressed(true);
        onPress();
    };

    const handlePointerUp = () => {
        setIsPressed(false);
        if (onRelease) onRelease();
    };

    return (
        <Container
            interactive
            pointerdown={handlePointerDown}
            pointerup={handlePointerUp}
            pointerupoutside={handlePointerUp}
        >
            <Graphics
                draw={(g) => {
                    g.clear();
                    g.beginFill(color, alpha);
                    g.drawCircle(0, 0, radius);
                    g.endFill();
                }}
                x={x}
                y={y}
            />
            <Text
                text={text}
                x={x}
                y={y}
                anchor={0.5}
                style={
                    new PIXI.TextStyle({
                        fill: 0xffffff,
                        fontSize: 20,
                        fontWeight: "bold",
                    })
                }
            />
        </Container>
    );
};

interface BirdProps {
    x: number;
    y: number;
    scale: number;
}

export const Bird: React.FC<BirdProps> = ({ x, y, scale }) => {
    const [wingPosition, setWingPosition] = useState(0);

    useTick((delta) => {
        setWingPosition((prev) => (prev + delta * 0.1) % (2 * Math.PI));
    });

    return (
        <Graphics
            scale={scale}
            draw={(g) => {
                g.clear();
                g.lineStyle(2, 0x000000);
                g.moveTo(x, y);
                g.lineTo(x - 10, y + Math.sin(wingPosition) * 5);
                g.moveTo(x, y);
                g.lineTo(x + 10, y + Math.cos(wingPosition + Math.PI) * 5);
            }}
        />
    );
};

interface FishProps {
    color: number;
}

export const Fish: React.FC<FishProps> = ({ color }) => {
    const [position, setPosition] = useState({ x: Math.random() * 800, y: 320 });
    const [jumping, setJumping] = useState(false);
    const jumpProgress = useRef(0);
    const [rotation, setRotation] = useState(0);

    useTick((delta) => {
        if (jumping) {
            jumpProgress.current += delta * 0.05;
            if (jumpProgress.current >= Math.PI) {
                setJumping(false);
                jumpProgress.current = 0;
                setPosition({ x: Math.random() * 800, y: 320 });
                setRotation(0);
            } else {
                const jumpHeight = Math.sin(jumpProgress.current) * 50;
                setPosition((prev) => ({
                    ...prev,
                    y: 320 - jumpHeight,
                }));
                setRotation(
                    jumpProgress.current < Math.PI / 2 ? -Math.PI / 4 : Math.PI / 4,
                );
            }
        } else if (Math.random() < 0.0005) {
            setJumping(true);
        }
    });

    return (
        <Graphics
            draw={(g) => {
                g.clear();
                if (jumping) {
                    g.beginFill(color);

                    const triangleCount = 6;
                    const baseWidth = 30;
                    const baseHeight = 10;

                    // Head triangle (pointing forward)
                    g.moveTo(0, 0);
                    g.lineTo(-baseWidth / 2, baseHeight / 2);
                    g.lineTo(-baseWidth / 2, -baseHeight / 2);
                    g.lineTo(0, 0);

                    // Body triangles (pointing backward)
                    for (let i = 1; i < triangleCount; i++) {
                        const width = baseWidth * (1 - i / triangleCount);
                        const height = baseHeight * (1 - i / triangleCount);
                        const xOffset = -i * (baseWidth / triangleCount) * 0.8;

                        g.moveTo(xOffset, 0);
                        g.lineTo(xOffset + width / 2, height / 2);
                        g.lineTo(xOffset + width / 2, -height / 2);
                        g.lineTo(xOffset, 0);
                    }

                    g.endFill();

                    // Fish eye
                    g.beginFill(0x000000);
                    g.drawCircle(-2, -2, 1);
                    g.endFill();
                }
            }}
            x={position.x}
            y={position.y}
            rotation={rotation}
        />
    );
};

interface CloudProps {
    x: number;
    y: number;
    scale: number;
    speed: number;
    zIndex: number;
}

export const Cloud: React.FC<CloudProps> = ({ x, y, scale, speed, zIndex }) => {
    const [position, setPosition] = useState({ x, y });

    useTick((delta) => {
        setPosition((prev) => ({ x: (prev.x - speed * delta) % 900, y: prev.y }));
    });

    return (
        <Graphics
            draw={(g) => {
                g.clear();
                g.beginFill(0xffffff, 0.5);
                g.drawCircle(0, 0, 20 * scale);
                g.drawCircle(15 * scale, -10 * scale, 15 * scale);
                g.drawCircle(-15 * scale, -5 * scale, 15 * scale);
                g.drawCircle(15 * scale, 10 * scale, 15 * scale);
                g.drawCircle(-15 * scale, 10 * scale, 15 * scale);
                g.endFill();
            }}
            x={position.x}
            y={position.y}
            zIndex={zIndex}
        />
    );
};

interface SunProps {
    x: number;
    y: number;
}

export const Sun: React.FC<SunProps> = ({ x, y }) => {
    return (
        <Graphics
            draw={(g) => {
                g.clear();
                g.beginFill(0xffff00);
                g.drawCircle(0, 0, 30);
                g.endFill();

                g.lineStyle(2, 0xffff00);
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    g.moveTo(Math.cos(angle) * 35, Math.sin(angle) * 35);
                    g.lineTo(Math.cos(angle) * 45, Math.sin(angle) * 45);
                }
            }}
            x={x}
            y={y}
        />
    );
};

interface WaveSimulationProps {
    width: number;
    height: number;
    onWaveUpdate: (wavePoints: number[]) => void;
    difficulty: number;
    speed: number;
}

export const WaveSimulation: React.FC<WaveSimulationProps> = ({
    width,
    height,
    onWaveUpdate,
    difficulty,
    speed,
}) => {
    const wavePoints = useRef<number[]>(Array(width).fill(0));
    const time = useRef(0);

    useTick((delta) => {
        time.current += delta * 0.01 * speed;
        const newWavePoints = [...wavePoints.current];

        const shiftAmount = Math.ceil(speed);
        for (let i = 0; i < width - shiftAmount; i++) {
            newWavePoints[i] = newWavePoints[i + shiftAmount];
        }

        for (let i = width - shiftAmount; i < width; i++) {
            const baseAmplitude = height * 0.05;
            const maxAmplitudeIncrease = height * 0.1;
            const smoothDifficulty = Math.min(difficulty, 50) / 50;
            const totalAmplitude =
                baseAmplitude + maxAmplitudeIncrease * smoothDifficulty;

            const t = time.current + (i - (width - shiftAmount)) / shiftAmount;
            const wave1 = Math.sin(t * 0.3) * totalAmplitude;
            const wave2 = Math.sin(t * 0.2) * totalAmplitude * 0.5;
            const wave3 = Math.sin(t * 0.7) * totalAmplitude * 0.3;
            const noise = (Math.random() - 0.5) * totalAmplitude * 0.1;
            newWavePoints[i] = wave1 + wave2 + wave3 + noise;
        }

        for (let i = 1; i < width - 1; i++) {
            newWavePoints[i] =
                (newWavePoints[i - 1] + newWavePoints[i] * 2 + newWavePoints[i + 1]) /
                4;
        }

        wavePoints.current = newWavePoints;
        onWaveUpdate(newWavePoints);
    });

    return null;
};

interface SeaProps {
    wavePoints: number[];
    sunX: number;
    sunY: number;
    width: number;
    height: number;
}

export const Sea: React.FC<SeaProps> = ({
    wavePoints,
    sunX,
    sunY,
    width,
    height,
}) => {
    return (
        <Graphics
            draw={(g) => {
                g.clear();

                const topColor = 0x0077be;
                const bottomColor = 0x00008b;
                const gradientSteps = 10;
                const baseY = height * 0.7;

                for (let i = 0; i < gradientSteps; i++) {
                    const ratio = i / (gradientSteps - 1);
                    const color = interpolateColor(topColor, bottomColor, ratio);

                    g.beginFill(color, 1 - ratio * 0.4);
                    g.moveTo(0, height);
                    wavePoints.forEach((y, x) => {
                        g.lineTo(x, baseY + y + ratio * (height - baseY));
                    });
                    g.lineTo(width, height);
                    g.endFill();
                }

                const reflectionWidth = width * 0.125;
                const reflectionCenter = sunX;
                g.beginFill(0xffff00, 0.3);
                wavePoints.forEach((y, x) => {
                    if (Math.abs(x - reflectionCenter) < reflectionWidth / 2) {
                        const intensity =
                            1 - Math.abs(x - reflectionCenter) / (reflectionWidth / 2);
                        g.drawCircle(x, baseY + y, 2 * intensity);
                    }
                });
                g.endFill();

                g.lineStyle(2, 0x87ceeb, 0.3);
                for (let i = 0; i < 3; i++) {
                    g.moveTo(0, baseY + ((height - baseY) * i) / 4);
                    wavePoints.forEach((y, x) => {
                        g.lineTo(x, baseY + ((height - baseY) * i) / 4 + y * 0.5);
                    });
                }
            }}
        />
    );
};

interface BoatProps {
    x: number;
    y: number;
    rotation: number;
    balance: number;
    capsizing: boolean;
}

export const Boat: React.FC<BoatProps> = ({
    x,
    y,
    rotation,
    balance,
    capsizing,
}) => {
    const boatWidth = 70;
    const boatHeight = 25;

    return (
        <Graphics
            draw={(g) => {
                g.clear();
                g.beginFill(0x8b4513);
                g.moveTo(-boatWidth / 2, -boatHeight / 2);
                g.lineTo(boatWidth / 2, -boatHeight / 2);
                g.lineTo(boatWidth / 2 + 10, 0);
                g.lineTo(boatWidth / 2, boatHeight / 2);
                g.lineTo(-boatWidth / 2, boatHeight / 2);
                g.lineTo(-boatWidth / 2 - 10, 0);
                g.endFill();

                g.lineStyle(2, 0x8b4513);
                g.moveTo(0, -boatHeight / 2);
                g.lineTo(0, -boatHeight / 2 - 20);

                g.beginFill(0xffffff);
                g.moveTo(0, -boatHeight / 2 - 20);
                g.lineTo(15, -boatHeight / 2);
                g.lineTo(0, -boatHeight / 2);
                g.endFill();

                g.beginFill(0xff0000);
                g.drawCircle((balance * boatWidth) / 2, 0, 5);
                g.endFill();
            }}
            x={x}
            y={y}
            rotation={rotation}
            alpha={capsizing ? Math.max(0, 1 - (y - 300) / 300) : 1}
        />
    );
};

interface SplashProps {
    x: number;
    y: number;
}

export const Splash: React.FC<SplashProps> = ({ x, y }) => {
    const [frame, setFrame] = useState(0);

    useTick((delta) => {
        setFrame((prev) => (prev + 1) % 5);
    });

    return (
        <Graphics
            draw={(g) => {
                g.clear();
                g.beginFill(0xffffff, 0.7);
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = 10 + frame * 2;
                    g.drawCircle(
                        Math.cos(angle) * radius,
                        Math.sin(angle) * radius,
                        2 + (4 - frame),
                    );
                }
                g.endFill();
            }}
            x={x}
            y={y}
        />
    );
};

interface MineProps {
    x: number;
    y: number;
    scale: number;
}

export const Mine: React.FC<MineProps> = ({ x, y, scale }) => {
    return (
        <Graphics
            draw={(g) => {
                g.clear();
                g.beginFill(0x333333);
                g.drawCircle(0, 0, 10);
                g.endFill();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    g.lineStyle(2, 0x333333);
                    g.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
                    g.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
                }
            }}
            x={x}
            y={y}
            scale={scale}
        />
    );
};
