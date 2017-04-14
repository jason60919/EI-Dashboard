package com.advantech.eipaas.dashboard.entities;

import javax.persistence.*;
import java.sql.Timestamp;

/**
 * Created by Alex.Shao on 2017/4/14.
 */
@Entity
@Table(name = "account", schema = "dashboard", catalog = "wisepaas")
public class AccountEntity {
    private long aid;
    private String name;
    private String fullname;
    private String firstname;
    private String lastname;
    private String mail;
    private String password;
    private boolean enabled;
    private Timestamp logints;
    private Timestamp createts;

    @Id
    @Column(name = "aid")
    public long getAid() {
        return aid;
    }

    public void setAid(long aid) {
        this.aid = aid;
    }

    @Basic
    @Column(name = "name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Basic
    @Column(name = "fullname")
    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    @Basic
    @Column(name = "firstname")
    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    @Basic
    @Column(name = "lastname")
    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    @Basic
    @Column(name = "mail")
    public String getMail() {
        return mail;
    }

    public void setMail(String mail) {
        this.mail = mail;
    }

    @Basic
    @Column(name = "password")
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Basic
    @Column(name = "enabled")
    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    @Basic
    @Column(name = "logints")
    public Timestamp getLogints() {
        return logints;
    }

    public void setLogints(Timestamp logints) {
        this.logints = logints;
    }

    @Basic
    @Column(name = "createts")
    public Timestamp getCreatets() {
        return createts;
    }

    public void setCreatets(Timestamp createts) {
        this.createts = createts;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        AccountEntity that = (AccountEntity) o;

        if (aid != that.aid) return false;
        if (enabled != that.enabled) return false;
        if (name != null ? !name.equals(that.name) : that.name != null)
            return false;
        if (fullname != null ? !fullname.equals(that.fullname) : that.fullname != null)
            return false;
        if (firstname != null ? !firstname.equals(that.firstname) : that.firstname != null)
            return false;
        if (lastname != null ? !lastname.equals(that.lastname) : that.lastname != null)
            return false;
        if (mail != null ? !mail.equals(that.mail) : that.mail != null)
            return false;
        if (password != null ? !password.equals(that.password) : that.password != null)
            return false;
        if (logints != null ? !logints.equals(that.logints) : that.logints != null)
            return false;
        if (createts != null ? !createts.equals(that.createts) : that.createts != null)
            return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = (int) (aid ^ (aid >>> 32));
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (fullname != null ? fullname.hashCode() : 0);
        result = 31 * result + (firstname != null ? firstname.hashCode() : 0);
        result = 31 * result + (lastname != null ? lastname.hashCode() : 0);
        result = 31 * result + (mail != null ? mail.hashCode() : 0);
        result = 31 * result + (password != null ? password.hashCode() : 0);
        result = 31 * result + (enabled ? 1 : 0);
        result = 31 * result + (logints != null ? logints.hashCode() : 0);
        result = 31 * result + (createts != null ? createts.hashCode() : 0);
        return result;
    }
}
