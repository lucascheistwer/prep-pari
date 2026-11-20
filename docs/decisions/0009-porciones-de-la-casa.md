# Porciones de la casa, sin datos de ejemplo

Estado: aceptada el 20 de noviembre de 2026.

Reemplaza, en la interfaz, la parte de [0008](0008-pantallas-sin-sesion.md) que mostraba un rendimiento editable por comida y porciones distintas en cada lugar del plan.

Las porciones se eligen una sola vez, en La casa: «¿Para cuántos cocinás normalmente?». Arranca en 4. No hay selector en la comida ni en el plan. El rendimiento que sugiere la comida (por ejemplo, «Rinde 1 tarta») queda como texto, para entender las cantidades.

Al poner una comida en el plan, la entrada guarda ese número de la casa. Si se cambia en La casa, se actualizan las entradas. La lista sigue escalando las cantidades de la comida contra ese número: el cálculo no cambia, cambia quién lo elige.

Una comida puede tener una descripción opcional. Sirve para reconocerla. No es una receta.

Un hogar nuevo no trae comidas, plan ni lista de ejemplo. Esos datos quedan solo como fixture de tests. Quien ya tenía guardada la versión anterior (`preppari.kitchen.v1`) pasa a `preppari.kitchen.v2`: se quitan las comidas, entradas e ítems de ejemplo y se conservan las comidas propias y lo agregado a mano.
