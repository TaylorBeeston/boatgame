import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Container, Graphics, Text, useTick } from "@pixi/react";
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

interface BirdProps {
    x: number;
    y: number;
    speed: number;
}

const Bird: React.FC<BirdProps> = ({ x, y, speed }) => {
    const [position, setPosition] = useState({ x, y });
    const [wingPosition, setWingPosition] = useState(0);

    useTick((delta) => {
        setPosition((prev) => ({ x: (prev.x - speed * delta) % 800, y: prev.y }));
        setWingPosition((prev) => (prev + delta * 0.1) % (2 * Math.PI));
    });

    return (
        <Graphics
            draw={(g) => {
                g.clear();
                g.lineStyle(2, 0x000000);
                g.moveTo(position.x, position.y);
                g.lineTo(position.x - 10, position.y + Math.sin(wingPosition) * 5);
                g.moveTo(position.x, position.y);
                g.lineTo(
                    position.x + 10,
                    position.y + Math.sin(wingPosition + Math.PI) * 5,
                );
            }}
        />
    );
};

interface FishProps {
    color: number;
}

const Fish: React.FC<FishProps> = ({ color }) => {
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

const Cloud: React.FC<CloudProps> = ({ x, y, scale, speed, zIndex }) => {
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

const Sun: React.FC<SunProps> = ({ x, y }) => {
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

const WaveSimulation: React.FC<WaveSimulationProps> = ({
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
            const baseAmplitude = 5;
            const maxAmplitudeIncrease = 30;
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
}

const Sea: React.FC<SeaProps> = ({ wavePoints, sunX, sunY }) => {
    return (
        <Graphics
            draw={(g) => {
                g.clear();

                const topColor = 0x0077be;
                const bottomColor = 0x00008b;
                const gradientSteps = 10;

                for (let i = 0; i < gradientSteps; i++) {
                    const ratio = i / (gradientSteps - 1);
                    const color = interpolateColor(topColor, bottomColor, ratio);

                    g.beginFill(color, 1 - ratio * 0.4);
                    g.moveTo(0, 600);
                    wavePoints.forEach((y, x) => {
                        g.lineTo(x, 300 + y + ratio * 300);
                    });
                    g.lineTo(800, 600);
                    g.endFill();
                }

                const reflectionWidth = 100;
                const reflectionCenter = sunX;
                g.beginFill(0xffff00, 0.3);
                wavePoints.forEach((y, x) => {
                    if (Math.abs(x - reflectionCenter) < reflectionWidth / 2) {
                        const intensity =
                            1 - Math.abs(x - reflectionCenter) / (reflectionWidth / 2);
                        g.drawCircle(x, 300 + y, 2 * intensity);
                    }
                });
                g.endFill();

                g.lineStyle(2, 0x87ceeb, 0.3);
                for (let i = 0; i < 3; i++) {
                    g.moveTo(0, 350 + i * 50);
                    wavePoints.forEach((y, x) => {
                        g.lineTo(x, 350 + i * 50 + y * 0.5);
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

const Boat: React.FC<BoatProps> = ({ x, y, rotation, balance, capsizing }) => {
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

const Splash: React.FC<SplashProps> = ({ x, y }) => {
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
}

const Mine: React.FC<MineProps> = ({ x, y }) => {
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
        />
    );
};

const Game: React.FC = () => {
    const [wavePoints, setWavePoints] = useState<number[]>([]);
    const [boatPosition, setBoatPosition] = useState({ x: 200, y: 300 });
    const [boatVelocity, setBoatVelocity] = useState({ x: 0, y: 0 });
    const [boatRotation, setBoatRotation] = useState(0);
    const [balance, setBalance] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [difficulty, setDifficulty] = useState(0);
    const [capsizing, setCapsizing] = useState(false);
    const [speed, setSpeed] = useState(5);
    const [isAirborne, setIsAirborne] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    const [jumpCount, setJumpCount] = useState(0);
    const [birds, setBirds] = useState<BirdProps[]>([]);
    const [clouds, setClouds] = useState<CloudProps[]>([]);
    const [mines, setMines] = useState<MineProps[]>([]);
    const [showNiceJump, setShowNiceJump] = useState(false);

    const stageRef = useRef<PIXI.Application | null>(null);
    const lastWaveAngle = useRef(0);

    const resetGame = useCallback(() => {
        setWavePoints([]);
        setBoatPosition({ x: 200, y: 300 });
        setBoatVelocity({ x: 0, y: 0 });
        setBoatRotation(0);
        setBalance(0);
        setGameOver(false);
        setScore(0);
        setDifficulty(0);
        setCapsizing(false);
        setSpeed(5);
        setIsAirborne(false);
        setShowSplash(false);
        setJumpCount(0);
        setMines([]);
    }, []);

    const jump = useCallback(() => {
        if (!isAirborne || jumpCount < 1) {
            const baseJumpVelocity = -10;
            const slopeBoost = Math.max(0, -lastWaveAngle.current * 50);
            const jumpVelocity = baseJumpVelocity - slopeBoost;
            setBoatVelocity((prev) => ({ ...prev, y: jumpVelocity }));
            setIsAirborne(true);
            setJumpCount((prev) => prev + 1);

            if (jumpVelocity < -15) {
                setShowNiceJump(true);
                setScore((prev) => prev + 100);
                setTimeout(() => setShowNiceJump(false), 1000);
            }
        }
    }, [isAirborne, jumpCount]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setBalance((prev) => Math.max(prev - 0.08, -1));
            } else if (e.key === "ArrowRight") {
                setBalance((prev) => Math.min(prev + 0.08, 1));
            } else if (e.key === "ArrowUp") {
                setSpeed((prev) => Math.min(prev + 1, 20));
            } else if (e.key === "ArrowDown") {
                setSpeed((prev) => Math.max(prev - 1, 5));
            } else if (e.key === " ") {
                jump();
            } else if (e.key === "Enter" && gameOver) {
                resetGame();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameOver, resetGame, jump]);

    useEffect(() => {
        const difficultyInterval = setInterval(() => {
            if (!gameOver) {
                setDifficulty((prev) => prev + (0.5 * speed) / 5); // Increased difficulty scaling
            }
        }, 1000);

        return () => clearInterval(difficultyInterval);
    }, [gameOver, speed]);

    useEffect(() => {
        const cloudInterval = setInterval(() => {
            if (clouds.length < 5) {
                setClouds((prev) => [
                    ...prev,
                    {
                        x: 800, // Start at the right edge of the screen
                        y: Math.random() * 200,
                        scale: 0.5 + Math.random() * 0.5,
                        speed: 0.2 + Math.random() * 0.3,
                        zIndex: Math.floor(Math.random() * 3),
                    },
                ]);
            }
        }, 5000);

        return () => clearInterval(cloudInterval);
    }, [clouds.length]);

    useEffect(() => {
        const birdInterval = setInterval(() => {
            if (birds.length < 3) {
                setBirds((prev) => [
                    ...prev,
                    {
                        x: 800, // Start at the right edge of the screen
                        y: Math.random() * 200 + 50,
                        speed: 0.5 + Math.random() * 0.5,
                    },
                ]);
            }
        }, 3000);

        return () => clearInterval(birdInterval);
    }, [birds.length]);

    const handleWaveUpdate = (newWavePoints: number[]) => {
        setWavePoints(newWavePoints);

        if (!capsizing) {
            const boatLeftIndex = Math.floor(boatPosition.x - 35);
            const boatRightIndex = Math.floor(boatPosition.x + 35);

            if (boatLeftIndex >= 0 && boatRightIndex < newWavePoints.length) {
                const leftWaveHeight = newWavePoints[boatLeftIndex];
                const rightWaveHeight = newWavePoints[boatRightIndex];
                const waveAngle = Math.atan2(rightWaveHeight - leftWaveHeight, 70);
                lastWaveAngle.current = waveAngle;

                const centerWaveHeight = (leftWaveHeight + rightWaveHeight) / 2;
                const waterSurfaceY = 300 + centerWaveHeight;

                if (isAirborne) {
                    setBoatVelocity((prev) => ({ ...prev, y: prev.y + 0.5 }));
                    const newBoatY = boatPosition.y + boatVelocity.y;

                    if (newBoatY >= waterSurfaceY) {
                        setIsAirborne(false);
                        setJumpCount(0);
                        setBoatPosition((prev) => ({ ...prev, y: waterSurfaceY }));
                        setBoatVelocity({ x: 0, y: 0 });
                        setShowSplash(true);
                        setTimeout(() => setShowSplash(false), 300);

                        if (Math.abs(boatRotation) > Math.PI / 2) {
                            setCapsizing(true);
                            setGameOver(true);
                        } else {
                            setBoatRotation(waveAngle);
                        }
                    } else {
                        setBoatPosition((prev) => ({ ...prev, y: newBoatY }));
                    }
                } else {
                    setBoatPosition((prev) => ({ ...prev, y: waterSurfaceY }));
                    setBoatRotation(waveAngle + balance * 0.3);
                }

                const difficultyFactor = 1 + difficulty * 0.03;
                const totalRotation = waveAngle * difficultyFactor + balance * 0.3;

                if (Math.abs(totalRotation) > Math.PI / 3.5 && !isAirborne) {
                    setCapsizing(true);
                    setGameOver(true);
                } else if (!gameOver) {
                    setScore((prev) => prev + speed / 5);
                }
            }
        } else {
            setBoatPosition((prev) => ({ ...prev, y: Math.min(prev.y + 2, 600) }));
            setBoatRotation((prev) => prev + 0.05);
        }

        setBirds((prev) =>
            prev
                .filter((bird) => bird.x > -50)
                .map((bird) => ({
                    ...bird,
                    x: bird.x - bird.speed * speed,
                })),
        );

        setClouds((prev) =>
            prev
                .filter((cloud) => cloud.x > -100)
                .map((cloud) => ({
                    ...cloud,
                    x: cloud.x - cloud.speed * speed,
                })),
        );

        setMines((prev) =>
            prev
                .filter((mine) => mine.x > -50)
                .map((mine) => ({
                    ...mine,
                    x: mine.x - speed,
                })),
        );

        // Check for collision with mines
        mines.forEach((mine) => {
            if (
                Math.abs(mine.x - boatPosition.x) < 35 &&
                Math.abs(mine.y - boatPosition.y) < 20
            ) {
                setCapsizing(true);
                setGameOver(true);
            }
        });
    };

    return (
        <div style={{ width: "800px", height: "600px", position: "relative" }}>
            <Stage
                width={800}
                height={600}
                options={{ backgroundColor: 0x87ceeb }}
                ref={stageRef}
            >
                <Container sortableChildren>
                    <Sun x={700} y={100} />
                    {clouds.map((cloud, index) => (
                        <Cloud key={index} {...cloud} />
                    ))}
                    <WaveSimulation
                        width={800}
                        height={600}
                        onWaveUpdate={handleWaveUpdate}
                        difficulty={difficulty}
                        speed={speed}
                    />
                    <Sea wavePoints={wavePoints} sunX={700} sunY={100} />
                    <Boat
                        x={boatPosition.x}
                        y={boatPosition.y}
                        rotation={boatRotation}
                        balance={balance}
                        capsizing={capsizing}
                    />
                    {showSplash && <Splash x={boatPosition.x} y={boatPosition.y + 20} />}
                    {birds.map((bird, index) => (
                        <Bird key={index} {...bird} />
                    ))}
                    {mines.map((mine, index) => (
                        <Mine key={index} {...mine} />
                    ))}
                    <Fish color={0x8b4513} />
                    <Fish color={0x008080} />
                    <Fish color={0x808080} />
                    <Text
                        text={`Score: ${Math.floor(score)}`}
                        x={10}
                        y={10}
                        style={{ fill: 0xffffff }}
                    />
                    <Text
                        text={`Difficulty: ${difficulty.toFixed(1)}`}
                        x={10}
                        y={30}
                        style={{ fill: 0xffffff }}
                    />
                    <Text
                        text={`Speed: ${speed}x`}
                        x={10}
                        y={50}
                        style={{ fill: 0xffffff }}
                    />
                    {showNiceJump && (
                        <Text
                            text="Nice Jump!"
                            x={400}
                            y={100}
                            style={{ fill: 0xffff00, fontSize: 24 }}
                            anchor={0.5}
                        />
                    )}
                </Container>
            </Stage>
            {gameOver && boatPosition.y >= 600 && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        padding: "20px",
                        borderRadius: "10px",
                        textAlign: "center",
                    }}
                >
                    <h2>Game Over!</h2>
                    <p>Your boat has capsized!</p>
                    <p>Final Score: {Math.floor(score)}</p>
                    <p>Max Difficulty: {difficulty.toFixed(1)}</p>
                    <p>Final Speed: {speed}x</p>
                    <p>Press Enter to restart</p>
                </div>
            )}
        </div>
    );
};

export default Game;
