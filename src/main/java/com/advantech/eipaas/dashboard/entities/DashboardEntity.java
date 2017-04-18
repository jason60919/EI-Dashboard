package com.advantech.eipaas.dashboard.entities;

import javax.persistence.*;
import java.sql.Timestamp;

/**
 * Created by Alex.Shao on 2017/4/14.
 */
@Entity
@Table(name = "dashboard", schema = "dashboard", catalog = "wisepaas")
public class DashboardEntity {
    private long did;
    private long aid;
    private String sheet;
    private String content;
    private int sequence;
    private Timestamp createts;

    @Id
    @SequenceGenerator(name="dashboard_did_seq", sequenceName="dashboard_did_seq", allocationSize=1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator="dashboard_did_seq")
    @Column(name = "did")
    public long getDid() {
        return did;
    }

    public void setDid(long did) {
        this.did = did;
    }

    @Basic
    @Column(name = "aid")
    public long getAid() {
        return aid;
    }

    public void setAid(long aid) {
        this.aid = aid;
    }

    @Basic
    @Column(name = "sheet")
    public String getSheet() {
        return sheet;
    }

    public void setSheet(String sheet) {
        this.sheet = sheet;
    }

    @Basic
    @Column(name = "content")
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @Basic
    @Column(name = "sequence")
    public int getSequence() {
        return sequence;
    }

    public void setSequence(int sequence) {
        this.sequence = sequence;
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

        DashboardEntity that = (DashboardEntity) o;

        if (did != that.did) return false;
        if (aid != that.aid) return false;
        if (sequence != that.sequence) return false;
        if (sheet != null ? !sheet.equals(that.sheet) : that.sheet != null)
            return false;
        if (content != null ? !content.equals(that.content) : that.content != null)
            return false;
        if (createts != null ? !createts.equals(that.createts) : that.createts != null)
            return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = (int) (did ^ (did >>> 32));
        result = 31 * result + (int) (aid ^ (aid >>> 32));
        result = 31 * result + (sheet != null ? sheet.hashCode() : 0);
        result = 31 * result + (content != null ? content.hashCode() : 0);
        result = 31 * result + sequence;
        result = 31 * result + (createts != null ? createts.hashCode() : 0);
        return result;
    }
}
