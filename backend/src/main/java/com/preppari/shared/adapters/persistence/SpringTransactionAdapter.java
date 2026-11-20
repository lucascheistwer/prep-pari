package com.preppari.shared.adapters.persistence;

import com.preppari.shared.application.TransactionPort;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class SpringTransactionAdapter implements TransactionPort {

  private final TransactionTemplate template;

  public SpringTransactionAdapter(PlatformTransactionManager manager) {
    this.template = new TransactionTemplate(manager);
  }

  @Override
  public <T> T inTransaction(Supplier<T> work) {
    return template.execute(status -> work.get());
  }
}
