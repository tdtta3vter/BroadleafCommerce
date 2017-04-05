/*
 * #%L
 * BroadleafCommerce Integration
 * %%
 * Copyright (C) 2009 - 2017 Broadleaf Commerce
 * %%
 * Licensed under the Broadleaf Fair Use License Agreement, Version 1.0
 * (the "Fair Use License" located  at http://license.broadleafcommerce.org/fair_use_license-1.0.txt)
 * unless the restrictions on use therein are violated and require payment to Broadleaf in which case
 * the Broadleaf End User License Agreement (EULA), Version 1.1
 * (the "Commercial License" located at http://license.broadleafcommerce.org/commercial_license-1.1.txt)
 * shall apply.
 * 
 * Alternatively, the Commercial License may be replaced with a mutually agreed upon license (the "Custom License")
 * between you and Broadleaf Commerce. You may not use this file except in compliance with the applicable license.
 * #L%
 */
/**
 * 
 */
package org.broadleafcommerce.test.config;

import org.broadleafcommerce.common.config.BroadleafEnvironmentConfiguringApplicationListener;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.ContextHierarchy;
import org.springframework.test.context.web.WebAppConfiguration;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * <p>
 * Convenient annotation for integration tests dealing with the Site applicationContext. This can be used to annotate
 * any type of test that uses spring-test (e.g. TestNG, Spock, JUnit).
 * 
 * <p>
 * Customization of the Spring ApplicationContext that this creates follows the same rules laid out in {@link ContextConfiguration}. Subclasses
 * should target the {@code "siteRoot"} context name in their {@link ContextHierarchy}.
 * 
 * <p>
 * Example usage:
 * <h2>JUnit</h2>
 * 
 * <pre>
 * {@literal @}RunWith(SpringRunner.class)
 * {@literal @}BroadleafSiteIntegrationTest
 * public class ExampleBroadleafJUnitTest {
 *     
 *     {@literal @}Autowired
 *     private CatalogService catalogService;
 *     
 *     {@literal @}Test
 *     public void catalogServiceInjected() {
 *         Assert.assertNotEquals(catalogService, null);
 *     }
 * }
 * </pre>
 * 
 * <h2>TestNG</h2>
 * <pre>
 * {@literal @}BroadleafSiteIntegrationTest
 * public class ExampleBroadleafTestNGTest extends AbstractTestNGSpringContextTests {
 *     
 *     {@literal @}Autowired
 *     private CatalogService catalogService;
 *     
 *     {@literal @}Test
 *     public void catalogServiceInjected() {
 *         Assert.assertNotEquals(catalogService, null);
 *     }
 * }
 * </pre>
 * 
 * <h2>Spock</h2>
 * <pre>
 * {@literal @}BroadleafSiteIntegrationTest
 * class SpockExampleTest extends Specification {
 *
 *     {@literal @}Resource
 *     private CatalogService catalogService
 *
 *     def "Test injection works"() {
 *         when: "The test is run"
 *         then: "The catalogService is injected"
 *         catalogService != null
 *     }
 * }
 * </pre>
 * 
 * <p>
 * When used within the Enterprise module, you cannot use both this annotation along with {@link BroadleafAdminIntegrationTest}. This is because
 * class transformation can be different depending on the context. For this reason, you usually need to split out your "site" and "admin"
 * tests into different JVM runs. This can be done with the following surefire configuration in Maven that brings everything contained
 * within a package that contains {@code adminjvm} into a completely separate JVM execution from anything in {@code sitejvm}.
 * 
 * <pre>
 * &lt;executions&gt;
 *   &lt;execution&gt;
 *      &lt;id&gt;default-test&lt;/id&gt;
 *      &lt;configuration&gt;
 *          &lt;includes&gt;
 *              &lt;!-- Include all the default Surefire tests --&gt;
 *              &lt;include&gt;&#42;&#42;&#47;Test&#42;.java,&#42;&#42;&#47;&#42;Test.java,&#42;&#42;&#47;&#42;TestCase.java,&#42;&#42;&#47;&#42;Spec&#42;&lt;/include&gt;
 *          &lt;/includes&gt;
 *          &lt;excludes&gt;
 *              &lt;exclude&gt;&#42;&#42;&#47;adminjvm/&#42;&#42;,&#42;&#42;&#47;sitejvm/&#42;&#42;,&#42;&#42;&#47;browsertests/&#42;&#42;&lt;/exclude&gt;
 *          &lt;/excludes&gt;
 *      &lt;/configuration&gt;
 *  &lt;/execution&gt;
 *  &lt;execution&gt;
 *      &lt;id&gt;admin-only-test&lt;/id&gt;
 *      &lt;goals&gt;
 *          &lt;goal&gt;test&lt;/goal&gt;
 *      &lt;/goals&gt;
 *      &lt;configuration&gt;
 *          &lt;includes&gt;
 *              &lt;include&gt;&#42;&#42;/adminjvm/&#42;&#42;&lt;/include&gt;
 *          &lt;/includes&gt;
 *      &lt;/configuration&gt;
 *  &lt;/execution&gt;
 *  &lt;execution&gt;
 *      &lt;id&gt;site-only-test&lt;/id&gt;
 *      &lt;goals&gt;
 *          &lt;goal&gt;test&lt;/goal&gt;
 *      &lt;/goals&gt;
 *      &lt;configuration&gt;
 *          &lt;includes&gt;
 *              &lt;include&gt;&#42;&#42;/sitejvm/&#42;&#42;&lt;/include&gt;
 *          &lt;/includes&gt;
 *      &lt;/configuration&gt;
 *  &lt;/execution&gt;
 * &lt;/executions&gt;
 * </pre>
 * 
 * @see BroadleafAdminIntegrationTest
 * @author Phillip Verheyden (phillipuniverse)
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ContextConfiguration(name="siteRoot",
    initializers = BroadleafEnvironmentConfiguringApplicationListener.class,
    classes = SiteTestContextConfiguration.class)
@WebAppConfiguration
@ActiveProfiles("mbeansdisabled")
public @interface BroadleafSiteIntegrationTest {

}
