package com.preppari.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

class ArchitectureTest {

  private static final JavaClasses CLASSES =
      new ClassFileImporter()
          .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
          .importPackages("com.preppari");

  @Test
  void domainDoesNotDependOnFrameworksOrAdapters() {
    noClasses()
        .that()
        .resideInAPackage("..domain..")
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage(
            "org.springframework..",
            "jakarta.persistence..",
            "org.hibernate..",
            "..adapters..",
            "..application..")
        .check(CLASSES);
  }

  @Test
  void applicationDoesNotDependOnSpringOrAdapters() {
    noClasses()
        .that()
        .resideInAPackage("..application..")
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage(
            "org.springframework..", "jakarta.persistence..", "org.hibernate..", "..adapters..")
        .check(CLASSES);
  }

  @Test
  void jobQueueDoesNotDependOnProductModules() {
    noClasses()
        .that()
        .resideInAPackage("com.preppari.jobs..")
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage(
            "com.preppari.dish..",
            "com.preppari.household..",
            "com.preppari.planner..",
            "com.preppari.shopping..",
            "com.preppari.identity..")
        .check(CLASSES);
  }
}
