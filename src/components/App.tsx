import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Container, Graphics, Text, useTick } from "@pixi/react";
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

const Wake: React.FC<WakeProps> = ({ x, y, speed }) => {
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

const CircleButton: React.FC<CircleButtonProps> = ({
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
    speed: number;
}

const Bird: React.FC<BirdProps> = ({ x, y, speed }) => {
    const [wingPosition, setWingPosition] = useState(0);

    useTick((delta) => {
        setWingPosition((prev) => (prev + delta * 0.1) % (2 * Math.PI));
    });

    return (
        <Graphics
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

const Sea: React.FC<SeaProps> = ({ wavePoints, sunX, sunY, width, height }) => {
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
    const [windowDimensions, setWindowDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [wavePoints, setWavePoints] = useState<number[]>([]);
    const [boatPosition, setBoatPosition] = useState({
        x: windowDimensions.width * 0.25,
        y: windowDimensions.height * 0.7,
    });
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
    const [birds, setBirds] = useState<any[]>([]);
    const [clouds, setClouds] = useState<any[]>([]);
    const [mines, setMines] = useState<any[]>([]);
    const [showNiceJump, setShowNiceJump] = useState(false);
    const [showGreatFlip, setShowGreatFlip] = useState(false);
    const [lastFlipTime, setLastFlipTime] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const stageRef = useRef<PIXI.Application | null>(null);
    const lastWaveAngle = useRef(0);

    useEffect(() => {
        const handleResize = () => {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const resetGame = useCallback(() => {
        setWavePoints([]);
        setBoatPosition({
            x: windowDimensions.width * 0.25,
            y: windowDimensions.height * 0.7,
        });
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
        setShowGreatFlip(false);
        setLastFlipTime(0);
        setIsFlipping(false);
        setBirds([]);
        setClouds([]);
        setMines([]);
    }, [windowDimensions]);

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
                setSpeed((prev) => Math.min(prev + 1, 100));
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
                setDifficulty((prev) => prev + (0.3 * speed) / 5);
            }
        }, 1000);

        return () => clearInterval(difficultyInterval);
    }, [gameOver, speed]);

    useEffect(() => {
        const birdInterval = setInterval(() => {
            if (birds.length < 3) {
                setBirds((prev) => [
                    ...prev,
                    {
                        x: windowDimensions.width,
                        y: Math.random() * windowDimensions.height * 0.5,
                        speed: 0.5 + Math.random() * 0.5,
                    },
                ]);
            }
        }, 3000);

        return () => clearInterval(birdInterval);
    }, [birds.length, windowDimensions]);

    useEffect(() => {
        const cloudInterval = setInterval(() => {
            if (clouds.length < 5) {
                setClouds((prev) => [
                    ...prev,
                    {
                        x: windowDimensions.width,
                        y: Math.random() * windowDimensions.height * 0.3,
                        scale: 0.5 + Math.random() * 0.5,
                        speed: 0.2 + Math.random() * 0.3,
                        zIndex: Math.floor(Math.random() * 3),
                    },
                ]);
            }
        }, 5000);

        return () => clearInterval(cloudInterval);
    }, [clouds.length, windowDimensions]);

    useEffect(() => {
        const mineInterval = setInterval(() => {
            if (Math.random() < 0.1 + difficulty * 0.01) {
                setMines((prev) => [
                    ...prev,
                    {
                        x: windowDimensions.width,
                        y:
                            windowDimensions.height * 0.7 +
                            Math.random() * windowDimensions.height * 0.2,
                    },
                ]);
            }
        }, 2000);

        return () => clearInterval(mineInterval);
    }, [difficulty, windowDimensions]);

    const handleSpeedIncrease = () => {
        setSpeed((prev) => Math.min(prev + 1, 100));
    };

    const handleSpeedDecrease = () => {
        setSpeed((prev) => Math.max(prev - 1, 5));
    };

    const handleWeightLeft = () => {
        setBalance((prev) => Math.max(prev - 0.08, -1));
    };

    const handleWeightRight = () => {
        setBalance((prev) => Math.min(prev + 0.08, 1));
    };

    const handleWaveUpdate = (newWavePoints: number[]) => {
        setWavePoints(newWavePoints);

        if (!capsizing) {
            const boatLeftIndex = Math.floor(
                (boatPosition.x / windowDimensions.width) * newWavePoints.length,
            );
            const boatRightIndex = Math.floor(
                ((boatPosition.x + 70) / windowDimensions.width) * newWavePoints.length,
            );

            if (boatLeftIndex >= 0 && boatRightIndex < newWavePoints.length) {
                const leftWaveHeight = newWavePoints[boatLeftIndex];
                const rightWaveHeight = newWavePoints[boatRightIndex];
                const waveAngle = Math.atan2(rightWaveHeight - leftWaveHeight, 70);
                lastWaveAngle.current = waveAngle;

                const centerWaveHeight = (leftWaveHeight + rightWaveHeight) / 2;
                const waterSurfaceY = windowDimensions.height * 0.7 + centerWaveHeight;

                if (isAirborne) {
                    setBoatVelocity((prev) => ({ ...prev, y: prev.y + 0.5 }));
                    const newBoatY = boatPosition.y + boatVelocity.y;

                    // Apply weight-based rotation in the air
                    setBoatRotation((prev) => prev + balance * 0.1);

                    // Detect flips
                    if (
                        Math.abs(boatRotation) > Math.PI * 2 &&
                        !isFlipping &&
                        Date.now() - lastFlipTime > 1000
                    ) {
                        setScore((prev) => prev + 5000);
                        setShowGreatFlip(true);
                        setIsFlipping(true);
                        setLastFlipTime(Date.now());
                        setTimeout(() => {
                            setShowGreatFlip(false);
                            setIsFlipping(false);
                        }, 1000);
                    }

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
            setBoatPosition((prev) => ({
                ...prev,
                y: Math.min(prev.y + 2, windowDimensions.height),
            }));
            setBoatRotation((prev) => prev + 0.05);
        }

        setBirds((prev) =>
            prev
                .filter((bird) => bird.x > -50)
                .map((bird) => ({
                    ...bird,
                    x:
                        (bird.x - bird.speed * speed + windowDimensions.width) %
                        windowDimensions.width,
                })),
        );

        setClouds((prev) =>
            prev
                .filter((cloud) => cloud.x > -100)
                .map((cloud) => ({
                    ...cloud,
                    x:
                        (cloud.x - cloud.speed * speed + windowDimensions.width) %
                        windowDimensions.width,
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
        <div
            style={{
                width: "100%",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Stage
                width={windowDimensions.width}
                height={windowDimensions.height}
                options={{ backgroundColor: 0x87ceeb }}
            >
                <Container>
                    <WaveSimulation
                        width={windowDimensions.width}
                        height={windowDimensions.height}
                        onWaveUpdate={handleWaveUpdate}
                        difficulty={difficulty}
                        speed={speed}
                    />
                    <Sea
                        wavePoints={wavePoints}
                        sunX={windowDimensions.width * 0.875}
                        sunY={windowDimensions.height * 0.125}
                        width={windowDimensions.width}
                        height={windowDimensions.height}
                    />
                    <Wake x={boatPosition.x} y={boatPosition.y} speed={speed} />
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
                    {clouds.map((cloud, index) => (
                        <Cloud key={index} {...cloud} />
                    ))}
                    {mines.map((mine, index) => (
                        <Mine key={index} {...mine} />
                    ))}
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
                            x={windowDimensions.width / 2}
                            y={windowDimensions.height / 2}
                            style={{ fill: 0xffff00, fontSize: 24 }}
                            anchor={0.5}
                        />
                    )}
                    {showGreatFlip && (
                        <Text
                            text="Great Flip!"
                            x={windowDimensions.width / 2}
                            y={windowDimensions.height / 2 - 40}
                            style={{ fill: 0xff00ff, fontSize: 24 }}
                            anchor={0.5}
                        />
                    )}
                    {isMobile && (
                        <Container>
                            <CircleButton
                                x={70}
                                y={windowDimensions.height - 70}
                                radius={50}
                                color={0x00ff00}
                                alpha={0.5}
                                text="+"
                                onPress={handleSpeedIncrease}
                            />
                            <CircleButton
                                x={70}
                                y={windowDimensions.height - 190}
                                radius={50}
                                color={0xff0000}
                                alpha={0.5}
                                text="-"
                                onPress={handleSpeedDecrease}
                            />
                            <CircleButton
                                x={windowDimensions.width - 70}
                                y={windowDimensions.height - 70}
                                radius={50}
                                color={0x0000ff}
                                alpha={0.5}
                                text="→"
                                onPress={handleWeightRight}
                            />
                            <CircleButton
                                x={windowDimensions.width - 190}
                                y={windowDimensions.height - 70}
                                radius={50}
                                color={0x0000ff}
                                alpha={0.5}
                                text="←"
                                onPress={handleWeightLeft}
                            />
                            <CircleButton
                                x={windowDimensions.width - 130}
                                y={windowDimensions.height - 190}
                                radius={70}
                                color={0xffff00}
                                alpha={0.5}
                                text="JUMP"
                                onPress={jump}
                            />
                            <CircleButton
                                x={windowDimensions.width / 2}
                                y={70}
                                radius={50}
                                color={0xffffff}
                                alpha={0.5}
                                text="↺"
                                onPress={resetGame}
                            />
                        </Container>
                    )}
                </Container>
            </Stage>
            {gameOver && (
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
                    {!isMobile && <p>Press Enter to restart</p>}
                    {isMobile && <button onClick={resetGame}>Restart</button>}
                </div>
            )}
        </div>
    );
};

export default Game;
