package com.preppari.jobs.application;

import com.preppari.jobs.domain.JobType;

/**
 * Handler de un tipo de job. Corre fuera de la transacción de claim: no debe sostener una conexión
 * mientras llama a un proveedor externo. Tiene que ser idempotente.
 */
public interface BackgroundJobHandler {

  JobType supportedType();

  void handle(ClaimedJob job);
}
