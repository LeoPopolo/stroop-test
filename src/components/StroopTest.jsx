import { useState, useEffect } from 'react';
import { utils as XLSXUtils, writeFile as writeExcelFile } from 'xlsx';
import './StroopTest.css';

var int_id = null;

const StroopTest = () => {
    //teclas presionadas correctamente durante el juego real
    const [ hits, setHits ] = useState(0);
    //teclas presionadas incorrectamente durante el juego real
    const [ misses, setMisses ] = useState(0);
    //codigo del color actual que se esta mostrando en la pantalla en el juego
    const [ currentColor, setCurrentColor ] = useState('custom-red');
    //nombre del color actual que se esta mostrando en la pantalla en el juego
    const [ currentColorName, setCurrentColorName ] = useState('AMARILLO');
    //Etapa del juego actual. opciones: intro, word-test, word-test-message, color-test, color-test-message, game, game-over
    const [ gameStatus, setGameStatus ] = useState('intro');
    //mensajes a mostrar en la interfaz del juego
    const [ gameMessage, setGameMessage ] = useState('color');
    //etapas de la intro del juego. Opciones: start, instructions, controls
    const [ gameIntroStatus, setGameIntroStatus ] = useState('start');
    //nombre del jugador actual. Campo requerido
    const [ playerName, setPlayerName ] = useState('');
    //lista de los tests realizados por el jugador actual
    const [ tests, setTests ] = useState([]);
    //Tiempo que tarda el jugador en presionar la tecla
    const [ currentTime, setCurrentTime ] = useState(new Date().getTime());
    //Contador de la cantidad de tests
    const [ currentTest, setCurrentTest ] = useState(1);
    //Contador de la cantidad de test de palabras (primer ensayo)
    const [ currentWordTest, setCurrentWordTest ] = useState(1);
    //Contador de la cantidad de test de colores (segundo ensayo)
    const [ currentColorTest, setCurrentColorTest ] = useState(1);

    useEffect(() => {
        if (gameStatus === 'game' && currentTest >= 73)  {
            clearInterval(int_id);
            setGameStatus('game-over');
            let storage_tests = JSON.parse(localStorage.getItem('stroop-tests'));
            if (!storage_tests) storage_tests = [];
            storage_tests.push(...tests);

            localStorage.setItem('stroop-tests', JSON.stringify(storage_tests));
            return;
        } else if (gameStatus === 'word-test' && currentWordTest >= 21) {
            setGameStatus('word-test-message');
        } else if (gameStatus === 'color-test' && currentColorTest >= 21) {
            setGameStatus('color-test-message');
        }

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    });

    const seeInstructions = () => {

        if (!playerName) {
            alert('Primero ingrese el DNI del jugador');
            return;
        }
        
        if (playerName.length !== 4) {
            alert('Deben ser los últimos 4 digitos del DNI');
            return;
        }

        setGameIntroStatus('instructions');
    }

    const startWordTest = () => {
        const colors = getCongruentTest();
        setCurrentColor(colors.code);
        setCurrentColorName(colors.name);
        setGameStatus('word-test');
        setCurrentWordTest(1);
    }

    const startColorTest = () => {
        const colors = getCongruentTest();
        setCurrentColor(colors.code);
        setCurrentColorName(colors.name);
        setGameStatus('color-test');
        setCurrentColorTest(1);
    }

    const startGame = () => {
        setCurrentColor(getRandomColor());
        setCurrentColorName(getRandomColorName());
        setHits(0);
        setMisses(0);
        setGameStatus('game');
        setCurrentTime(new Date().getTime());
        setTests([]);
        setCurrentTest(1);
        clearInterval(int_id);
        const id = setInterval(() => {
            clearInterval(int_id);
            setTimeOutActions();
        }, 2000);
        int_id = id;
    };

    const setTimeOutActions = () => {
        setMisses(misses + 1);
        setGameMessage('wrong');

        setTests([
            ...tests,
            {
                player: playerName,
                datetime: new Date().toLocaleString(),
                is_congruent: currentColorIsCongruent(),
                time: 'timeout',
                is_correct: false,
                test: currentTest,
            }
        ]);
        setCurrentTest(currentTest + 1);

        setCurrentColor(getRandomColor());
        setCurrentColorName(getRandomColorName());
        
        setTimeout(() => {
            setGameMessage('');
            
            setTimeout(() => { 
                setGameMessage('+');
    
                setTimeout(() => {
                    setGameMessage('');

                    setTimeout(() => { 
                        setGameMessage('color');

                        clearInterval(int_id);
                        const id = setInterval(() => {
                            clearInterval(int_id);
                            setTimeOutActions();
                        }, 2000);
                        int_id = id;
                    }, 500);
                }, 200);
            }, 300);
        }, 200);
    }

    const handleKeyPress = (event) => {
        
        if (gameStatus === 'game-over') return;

        if (gameStatus === 'intro' && gameIntroStatus === 'instructions') {
            if (event.code === 'Space') {
                setGameIntroStatus('controls');
                return;
            }
        } else if (gameStatus === 'intro' && gameIntroStatus === 'controls') {
            if (event.code === 'Space') {
                startWordTest();
                return;
            }
        } else if (gameStatus === 'word-test-message') {
            if (event.code === 'Space') {
                startColorTest();
                return;
            }
        } else if (gameStatus === 'color-test-message') {
            if (event.code === 'Space') {
                startGame();
                return;
            }
        }

        let is_correct = false;
        clearInterval(int_id);

        switch (event.key) {
            case 'F5':
                if (currentColor === 'custom-green') {
                    is_correct = true;
                } else {
                    is_correct = false;
                }
                break;
            case 'F6':
                if (currentColor === 'custom-red') {
                    is_correct = true;
                } else {
                    is_correct = false;
                }
                break;
            case 'F7':
                if (currentColor === 'custom-yellow') {
                    is_correct = true;
                } else {
                    is_correct = false;
                }
                break;
            case 'F8':
                if (currentColor === 'custom-blue') {
                    is_correct = true;
                } else {
                    is_correct = false;
                }
                break;
            default: {
                return;
            }
        }
        event.preventDefault();
        
        if (is_correct) {
            if (gameStatus === 'game') 
                setHits(hits + 1);
            setGameMessage('correct');
        } else if (!is_correct) {
            if (gameStatus === 'game') 
                setMisses(misses + 1);
            setGameMessage('wrong');
        }

        if (gameStatus === 'game') {
            const time = new Date().getTime() - currentTime;
            setCurrentTime(new Date().getTime());
    
            setTests([
                ...tests,
                {
                    player: playerName,
                    datetime: new Date().toLocaleString(),
                    is_congruent: currentColorIsCongruent(),
                    time,
                    is_correct,
                    test: currentTest
                }
            ]);

            setCurrentTest(currentTest + 1);
        } else if (gameStatus === 'word-test')
            setCurrentWordTest(currentWordTest + 1);
          else if (gameStatus === 'color-test')
            setCurrentColorTest(currentColorTest + 1);

        if (gameStatus === 'word-test' || gameStatus === 'color-test') {
            const colors = getCongruentTest();
            setCurrentColor(colors.code);
            setCurrentColorName(colors.name);
        } else {
            setCurrentColor(getRandomColor());
            setCurrentColorName(getRandomColorName());
        }

        setTimeout(() => {
            setGameMessage('');
            
            setTimeout(() => { 
                setGameMessage('+');
    
                setTimeout(() => {
                    setGameMessage('');

                    setTimeout(() => { 
                        setGameMessage('color');

                        if (gameStatus !== 'game') return;
                        clearInterval(int_id);
                        const id = setInterval(() => {
                            clearInterval(int_id);
                            setTimeOutActions();
                        }, 2000);
                        int_id = id;
                    }, 500);
                }, 200);
            }, 300);
        }, 200);
    }

    const currentColorIsCongruent = () => {
        return currentColor === 'custom-red' && currentColorName === 'ROJO' ||
                currentColor === 'custom-yellow' && currentColorName === 'AMARILLO' ||
                currentColor === 'custom-green' && currentColorName === 'VERDE' ||
                currentColor === 'custom-blue' && currentColorName === 'AZUL';
    }

    const getRandomColor = () => {
        const colors = ['custom-red', 'custom-green', 'custom-yellow', 'custom-blue'];
        return colors[Math.floor(Math.random() * colors.length)];
    };
    
    const getRandomColorName = () => {
        const colors = ['ROJO', 'VERDE', 'AMARILLO', 'AZUL'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    const getCongruentTest = () => {
        const colors = [
            {
                code: 'custom-red',
                name: 'ROJO'
            },
            {
                code: 'custom-green',
                name: 'VERDE'
            },
            {
                code: 'custom-yellow',
                name: 'AMARILLO'
            },
            {
                code: 'custom-blue',
                name: 'AZUL'
            },
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    const changePlayerName = (data) => {
        setPlayerName(data.target.value);
    }

    const getTestQuantity = (is_congruent) => {
        let total = 0;
        tests.forEach(item => {
            if (item.is_congruent === is_congruent)
                total ++;
        });

        return total;
    }

    const getAverageTime = (is_congruent) => {
        let total = 0;
        const tests_with_time = tests.map(item => {
            if (parseInt(item.time)) return item;
        });

        tests_with_time.forEach(item => {
            if (item && item.is_congruent === is_congruent)
                total += item.time;
        });

        const total_quantity = getTestQuantity(is_congruent);

        if (!total_quantity) return 0;

        return (total / getTestQuantity(is_congruent)).toFixed(2);
    }

    const restartGame = () => {
        window.location.reload();
    }
    
    const downloadExcel = () => {
        const data = JSON.parse(localStorage.getItem('stroop-tests'));

        const wb = XLSXUtils.book_new();

        const json_data = data.map((item) => {
            return {
                dni: item.player,
                fecha: item.datetime,
                ensayo: 'test ' + item.test,
                tipo: item.is_congruent ? 'Congruente' : 'Incongruente',
                tiempo: item.time,
                desempeño: item.is_correct ? 'Correcto' : 'Incorrecto'
            };
        });

        const ws = XLSXUtils.json_to_sheet(json_data);

        XLSXUtils.book_append_sheet(wb, ws, 'Sheet 1');

        writeExcelFile(wb, 'stroop.xlsx');
    }
    
    return (
        <div>
            {gameStatus === "intro" && (
                <>
                    {gameIntroStatus === "start" && (
                    <>
                        <button onClick={downloadExcel} className='download-excel'>generar excel</button>
                        <div className="color-container">
                            <button className="btn-start" onClick={seeInstructions}>
                            Empezar juego
                            </button>
                        </div>
                        <div className='player-name-container'>
                            <input className='input-player-name' type="text" onChange={changePlayerName} placeholder='DNI (4 dígitos)'/>
                        </div>
                    </>
                    )}

                    {gameIntroStatus === "instructions" && (
                        <div className="color-container instructions">
                            <h1>Instrucciones del test <span>S</span><span>t</span><span>r</span><span>o</span><span>o</span><span>p</span> </h1>
                            <p>
                                En esta prueba, se le presentarán palabras impresas en la
                                pantalla de la computadora en diferentes colores. Las palabras
                                que se presentarán son "rojo", "verde", "azul" y "amarillo".
                                Su tarea es indicar el color de la tinta en que están escritas
                                las palabras, ignorando el significado de las palabras mismas. <br /> <br />
                                Por ejemplo, si ve la palabra <span className='color-green'>ROJO</span> escrita en tinta verde,
                                deberá presionar la tecla correspondiente al color verde, ya
                                que es el color de la tinta en que está escrita la palabra. Si
                                ve la palabra <span className='color-blue'>AMARILLO</span> escrita en tinta azul, deberá
                                presionar la tecla correspondiente al color azul.
                            </p>
                            <p className='continue-message'>Presione la barra espaciadora para continuar...</p>
                        </div>
                    )}

                    {gameIntroStatus === "controls" && (
                        <div className="color-container instructions">
                            <h1> Practiquemos </h1>
                            <p>
                                En esta prueba, se le presentarán palabras impresas en la
                                pantalla de la computadora en diferentes colores. Las palabras
                                que se presentarán son "rojo", "verde", "azul" y "amarillo".
                                Su tarea es indicar el color de la tinta en que están escritas
                                las palabras.
                            </p>
                            <p className='continue-message'>Presione la barra espaciadora para continuar...</p>
                        </div>
                    )}
                </>
            )}

            {gameStatus === "word-test-message" && (
                <div className="color-container instructions">
                    <h1> ¡Bien! Ahora sólo con colores </h1>
                    <p>
                        En esta prueba, se le presentarán diferentes colores en la
                        pantalla de la computadora. Su tarea es indicar el color de la tinta de la barra.
                    </p>
                    <p className='continue-message'>Presione la barra espaciadora para continuar...</p>
                </div>
            )}
            
            {gameStatus === "color-test-message" && (
                <div className="color-container instructions">
                    <h1> Ahora sí comencemos </h1>
                    <p>
                        Responda lo más rápido y preciso que pueda, evitando errores.
                        En algunos ensayos, la tarea puede ser más difícil debido a la
                        incongruencia entre la palabra y el color de la tinta en que
                        está escrita. Así que concéntrate e ignora el significado de
                        las palabras de colores, en su lugar, fíjate en el color de la
                        tinta. Tendrás varias pruebas y se tarda alrededor de 5
                        minutos en completarlas. Al final, se te proporcionarán los
                        tiempos de respuesta obtenidos. ¡Comencemos!
                    </p>
                    <p className='continue-message'>Presione la barra espaciadora para continuar...</p>
                </div>
            )}

            {(gameStatus === "game" || gameStatus === "word-test" || gameStatus === "color-test") && (
            <>
                <div className="color-container">
                {gameMessage === "color" && (
                    <>
                        {gameStatus !== 'color-test' && <p style={{ color: `var(--${currentColor})` }}>
                            {currentColorName}
                        </p>}

                        {gameStatus === 'color-test' && <p className='no-word-bar' style={{ background: `var(--${currentColor})` }}></p>}
                    </> 
                    
                )}
                {gameMessage === "+" && <p className="game-message plus">+</p>}
                {gameMessage === "correct" && (
                    <p className="game-message">Correcto</p>
                )}
                {gameMessage === "wrong" && (
                    <p className="game-message">Incorrecto</p>
                )}
                </div>
            </>
            )}

            {
                gameStatus === 'game-over' && (
                    <>
                        <div className='color-container game-over'>
                            <p>Tu tiempo promedio congruente: {getAverageTime(true)}ms</p>
                            <p>Tu tiempo promedio incongruente: {getAverageTime(false)}ms</p>
                            <p>Test correctos: {hits}</p>
                            <p>Test incorrectos: {misses}</p>
                        </div>
                        <div className='restart-container'>
                            <button className='btn-restart' onClick={restartGame}>Volver a jugar</button>
                        </div>
                    </>
                )
            }
        </div>
    );
}


export default StroopTest;