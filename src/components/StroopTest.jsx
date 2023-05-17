import { useState, useEffect } from 'react';
import { utils as XLSXUtils, writeFile as writeExcelFile } from 'xlsx';
import './StroopTest.css';

const StroopTest = () => {
    const [ timeLeft, setTimeLeft ] = useState(30);
    const [ hits, setHits ] = useState(0);
    const [ misses, setMisses ] = useState(0);
    const [ currentColor, setCurrentColor ] = useState('custom-red');
    const [ currentColorName, setCurrentColorName ] = useState('AMARILLO');
    const [ gameStatus, setGameStatus ] = useState('intro');
    const [ gameMessage, setGameMessage ] = useState('color');
    const [ gameIntroStatus, setGameIntroStatus ] = useState('start');
    const [ playerName, setPlayerName ] = useState('');
    const [ tests, setTests ] = useState([]);
    const [ currentTime, setCurrentTime ] = useState(new Date().getTime());
    const [ currentTest, setCurrentTest ] = useState(1);

    useEffect(() => {
        if (timeLeft < 1 && gameStatus === 'game')  {
            setGameStatus('game-over');
            let storage_tests = JSON.parse(localStorage.getItem('stroop-tests'));
            if (!storage_tests) storage_tests = [];
            storage_tests.push(...tests);

            localStorage.setItem('stroop-tests', JSON.stringify(storage_tests));
            return;
        }
        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    });

    const seeInstructions = () => {

        if (!playerName) {
            alert('primero ingrese el nombre del jugador');
            return;
        }
        setGameIntroStatus('instructions');
    }

    const startGame = () => {
        setCurrentColor(getRandomColor());
        setCurrentColorName(getRandomColorName());
        setTimeLeft(30);
        setHits(0);
        setMisses(0);
        setGameStatus('game');
        setCurrentTime(new Date().getTime());
        setTests([]);
        setCurrentTest(1);
    };

    const handleKeyPress = (event) => {

        if (gameStatus === 'game-over') return;

        if (gameStatus === 'intro' && gameIntroStatus === 'instructions') {
            if (event.code === 'Space') {
                setGameIntroStatus('controls');
                return;
            }
        } else if (gameStatus === 'intro' && gameIntroStatus === 'controls') {
            if (event.code === 'Space') {
                startGame();
                return;
            }
        }

        let is_correct = false;

        switch (event.key) {
            case 'v':
                if (currentColor === 'custom-green') {
                    is_correct = true;
                } else {
                    is_correct = false;
                }
                break;
            case 'b':
                if (currentColor === 'custom-red') {
                    is_correct = true;
                } else {
                    is_correct = false;
                }
                break;
            case 'n':
                if (currentColor === 'custom-yellow') {
                    is_correct = true;
                } else {
                    is_correct = false;
                }
                break;
            case 'm':
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

        if (is_correct) {
            setHits(hits + 1);
            setGameMessage('correct');
        } else if (!is_correct) {
            setMisses(misses + 1);
            setGameMessage('wrong');
        }

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
        setCurrentColor(getRandomColor());
        setCurrentColorName(getRandomColorName());

        setTimeout(() => {
            setGameMessage('');
            
            setTimeout(() => { 
                setGameMessage('+');
    
                setTimeout(() => {
                    setGameMessage('');

                    setTimeout(() => { setGameMessage('color') }, 500);
                }, 200);
            }, 300);
        }, 200);
    }

    useEffect(() => {
        if (timeLeft > 0) {
          const timerId = setTimeout(() => {
            setTimeLeft((prevTime) => prevTime - 1);
          }, 1000);
    
          return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

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
        tests.forEach(item => {
            if (item.is_congruent === is_congruent)
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
                nombre: item.player,
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
                    <input className='input-player-name' type="text" onChange={changePlayerName} placeholder='Nombre...'/>
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
          </>
        )}

        {gameStatus === "game" && (
          <>
            <div className="color-container">
              {gameMessage === "color" && (
                <p style={{ color: `var(--${currentColor})` }}>
                  {currentColorName}
                </p>
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