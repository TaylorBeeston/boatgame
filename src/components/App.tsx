import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Container, Graphics, Text, useTick } from "@pixi/react";
import * as PIXI from "pixi.js";

// Assume these components are defined elsewhere
import {
    CircleButton,
    Boat,
    Fish,
    Sea,
    Bird,
    Cloud,
    Mine,
    Splash,
    Wake,
    WaveSimulation,
} from "./Components";

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
    const [flipDirection, setFlipDirection] = useState<number>(0);
    const [flipProgress, setFlipProgress] = useState<number>(0);

    const stageRef = useRef<PIXI.Application | null>(null);
    const lastWaveAngle = useRef(0);

    const startFlip = useCallback(
        (direction: number) => {
            if (isAirborne && flipDirection === 0) {
                setFlipDirection(direction);
                setFlipProgress(0);
            }
        },
        [isAirborne, flipDirection],
    );

    const flipLeft = useCallback(() => startFlip(-1), [startFlip]);
    const flipRight = useCallback(() => startFlip(1), [startFlip]);

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
                flipLeft();
            } else if (e.key === "ArrowRight") {
                flipRight();
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
    }, [gameOver, resetGame, jump, flipLeft, flipRight]);

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
                        y: windowDimensions.height * 0.7, // Mines appear at the top of the water
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

    useEffect(() => {
        if (flipDirection !== 0) {
            const flipInterval = setInterval(() => {
                setFlipProgress((prev) => {
                    const next = prev + 0.05;
                    if (next >= 1) {
                        setFlipDirection(0);
                        setScore((prev) => prev + 5000);
                        setShowGreatFlip(true);
                        setIsFlipping(true);
                        setLastFlipTime(Date.now());
                        setTimeout(() => {
                            setShowGreatFlip(false);
                            setIsFlipping(false);
                        }, 1000);
                        return 0;
                    }
                    return next;
                });
            }, 16); // Approximately 60fps

            return () => clearInterval(flipInterval);
        }
    }, [flipDirection]);

    useEffect(() => {
        if (flipDirection !== 0) {
            setBoatRotation(flipDirection * flipProgress * Math.PI * 2);
        }
    }, [flipDirection, flipProgress]);

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

                        if (
                            Math.abs(boatRotation) % (2 * Math.PI) > Math.PI / 2 &&
                            Math.abs(boatRotation) % (2 * Math.PI) < (3 * Math.PI) / 2
                        ) {
                            setCapsizing(true);
                            setGameOver(true);
                        } else {
                            setBoatRotation(0);
                        }
                    } else {
                        setBoatPosition((prev) => ({ ...prev, y: newBoatY }));
                    }
                } else {
                    setBoatPosition((prev) => ({ ...prev, y: waterSurfaceY }));
                    setBoatRotation(0);
                }

                if (!gameOver) {
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

        // Check for collision with mines or birds
        // Check for collision with mines or birds
        const checkCollision = (objects: any[], objectRadius: number) => {
            return objects.some(
                (obj) =>
                    Math.abs(obj.x - boatPosition.x) < objectRadius &&
                    Math.abs(obj.y - boatPosition.y) < objectRadius,
            );
        };

        if (checkCollision(mines, 20) || checkCollision(birds, 30)) {
            setCapsizing(true);
            setGameOver(true);
        }
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
                        capsizing={capsizing}
                    />
                    {showSplash && <Splash x={boatPosition.x} y={boatPosition.y + 20} />}
                    {birds.map((bird, index) => (
                        <Bird key={index} {...bird} scale={2} />
                    ))}
                    {clouds.map((cloud, index) => (
                        <Cloud key={index} {...cloud} />
                    ))}
                    {mines.map((mine, index) => (
                        <Mine key={index} {...mine} scale={2} />
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
                            text="Nice Jump! +100 Points"
                            x={windowDimensions.width / 2}
                            y={windowDimensions.height / 2}
                            style={{ fill: 0xffff00, fontSize: 24 }}
                            anchor={0.5}
                        />
                    )}
                    {showGreatFlip && (
                        <Text
                            text="Great Flip! +5000 Points"
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
                                onPress={flipRight}
                            />
                            <CircleButton
                                x={windowDimensions.width - 190}
                                y={windowDimensions.height - 70}
                                radius={50}
                                color={0x0000ff}
                                alpha={0.5}
                                text="←"
                                onPress={flipLeft}
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
                    {!isMobile && <p>Press Enter to restart</p>}
                    {isMobile && <button onClick={resetGame}>Restart</button>}
                </div>
            )}
        </div>
    );
};

export default Game;
