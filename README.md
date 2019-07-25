# bionicarm
Proiect BionicArm pentru Infoeducatie 2019
# Prezentare
	Bionic arm este este o mâna bionică, la dimensiunile uneia reale, realizata cu ajutorul unei imprimante 3D și controlată cu un senzor Leap Motion, pentru urmărirea spațiala mâinilor, este folosită în special pentru aplicații de VR. Mâna este bionică, nu robotică, deoarece asemenea mâini umane, care are 2 tendoane care o controlează, una pentru a strânge degetul și alta pentru al deschide, așa și acestă mână are 2 fire controlate de un servo motor, cu un cap special pentru a acționa fiecare deget în parte, ceea ce duce la 5 servo-motoare de dimensiune standard, asemănătoare cu MG996R, poziționate în antebrațul mâini, iar firul folosit este fir de pescuit rezistent pană la 100kg.  
	Bicepsul funcționează asemena unui actuator, care trage trage antebrațul, fixat într-un punct, avem un servo-motor de dimensiune gigant, HS-805BB, care are în cap un șurub trapezoidal și care a fost modificat, scoțându-se în exterior potențiometrul pentru poziție și modificând ultima roată dințată pentru a se putea rotii mai mult de 180 de grade. Potențiometrul scos s-a pus la cot pentru a putea controla mai bine unghiul pe care îl face mâna cu bicepsul. Aceste modificări au fost aduse deoarece având un actuator realizat dintr-un servo-motor nu puteam controla foarte bine poziția. Am optat pentru această soluție deoarece datorita razei mici care o are șurubul trapezoidal actuatorul poate să tragă o forță mult mai mare.  
	Umărul permite rotirea mâini stânga dreapta. A fost realizat folosind un sistem compus dintr-un ax cu melc și o roată melcată. Axul cu melc este conectat la un servo-motor, de aceiași dimensiune și având aceleași modificări ca cel de la biceps. De roata melcată este conectat restul brațului, bicepsul și cu mâna, și potențiometrul scos, pentru a știi în ce poziție se află. Între colivia roți melcate și prinderea bicepsului se afla bile de rulment pentru a reduce frecare și ca mișcarea sa fie mai lina. Am folosit această soluție mecanica deoarece angrenajul de tip melc mărește cuplul motorului și nu permite să i se modifice poziția.  
    Pentru controlul, Leap Motion-ul ne returnează coordonatele  vectoriale ale fiecărui os din din mână, astfel pentru a controlul degetelor realizez unghiul vectorilor metacarpienelor și falangelor intermediare, folosind formula de calcul din clasa a noua. Iar pentru mișcarea bicepsului folosesc unghiul dintre antebraț și planul xOz, iar pentru mișcarea umărului folosesc unghiul dintre antebraț și planul yOz. Pentru controlul fizic al servo motoarelor folosesc o placa Arduino care are instalată pe ea Standart Firmata, un fel de web socket, împreună cu biblioteca johnny-five.  

# Materiale folosite
* Leap Motion
* placă Arduino
* 6 x Servo-motoare MG996R
* 2 x Servo-motoare HS-805BB
* 2 role de filament 3D
* fir de pescuit

# DOCS
* http://inmoov.fr/hand-and-forarm/
* http://inmoov.fr/bicep/
* https://developer-archive.leapmotion.com/documentation/javascript/index.html
* http://johnny-five.io/api/

# Use
## Pentru placa de pe mana
Se gaseste codul in folderul orangepi. Pentru folosire, trebuie instalat node.js si pachetele adiacente, folosind comanda npm install
## Pentru calculator
Se instaleaza driverul de LeapMotion si node.js, ;i la fel ca la pasul anterior se foloseste comanda npm install pentru pachetele necesare. Pentru o mai simpla utilizare in folderul frontend se gaseste o varianta grafica de control a aplicatie.
